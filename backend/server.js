console.log("Starting...");
console.log("Loading express...");
const express = require('express');
console.log("Loading cors...");
const cors = require('cors');
console.log("Loading dotenv...");
const dotenv = require('dotenv');
console.log("Loading path...");
const path = require('path');
console.log("Loading http...");
const http = require('http');
console.log("Loading socket.io...");
const { Server } = require('socket.io');
console.log("Loading node-cron...");
const cron = require('node-cron');
console.log("Loading db...");
const { db, initDb } = require('./database');
console.log("Loading email utils...");
const sendEmail = require('./utils/email');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Trust the first proxy hop (Railway/Nginx) so client IPs are correct for rate limiting
app.set('trust proxy', 1);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // allow frontend access
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// Attach io to app so routes can use it via req.app.get('io')
app.set('io', io);
app.set('db', db);

// Redis setup for Socket.io adapter and caching
if (process.env.REDIS_URL || process.env.REDISPROXY_URL) {
  console.log("Loading redis & socket.io redis-adapter dynamically...");
  const { createClient } = require('redis');
  const { createAdapter } = require('@socket.io/redis-adapter');

  const redisUrl = process.env.REDIS_URL || process.env.REDISPROXY_URL;
  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    console.log('✅ Redis connected successfully on Railway');
    io.adapter(createAdapter(pubClient, subClient));
    app.set('redis', pubClient);
  }).catch((err) => {
    console.error('❌ Redis connection error:', err);
  });
} else {
  console.log('⚠️ No REDIS_URL found. Running without Redis.');
}

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use(cors());
app.use(express.json());
app.set('io', io);

console.log('Loading routes...');
console.log('Loading authRoutes...');
const authRoutes = require('./routes/auth');
console.log('Loading userRoutes...');
const userRoutes = require('./routes/users');
console.log('Loading taskRoutes...');
const taskRoutes = require('./routes/tasks');
console.log('Loading permissionRoutes...');
const permissionRoutes = require('./routes/permissions');
console.log('Loading activityRoutes...');
const activityRoutes = require('./routes/activity');
console.log('Loading dashboardRoutes...');
const dashboardRoutes = require('./routes/dashboard');
console.log('Loading eventRoutes...');
const eventRoutes = require('./routes/events');
console.log('Loading projectRoutes...');
const projectRoutes = require('./routes/projects');
console.log('Loading notificationsRoutes...');
const notificationsRoutes = require('./routes/notifications');
console.log('Loading expenseRoutes...');
const expenseRoutes = require('./routes/expenses');
console.log('Loading reminderRoutes...');
const reminderRoutes = require('./routes/reminders');
console.log('Loading gymRoutes...');
const gymRoutes = require('./routes/gym');
const { sendReminderNotification } = require('./utils/reminderEmail');
console.log('Finished loading routes.');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/gym', gymRoutes);

// Cron Job for Event & Reminders (Checks every minute)
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    
    // --- 1. Event Reminders (Original Logic) ---
    const events = await db.all("SELECT * FROM events WHERE reminder_sent = 0");
    for (const event of events) {
      const eventDateTime = new Date(`${event.event_date}T${event.event_time}`);
      const diffMs = eventDateTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      
      if (diffMinutes > 0 && diffMinutes <= 120) {
        await db.run('UPDATE events SET reminder_sent = 1 WHERE id = $1', [event.id]);
        await sendEmail({
          to: 'kunjbhuva301@gmail.com',
          subject: `Reminder: ${event.title} starts in 2 hours!`,
          text: `Reminder: Your event "${event.title}" is scheduled to start at ${event.event_time} on ${event.event_date}.`
        });
      }
    }

    // --- 2. Advanced Reminders (IST Timezone Aware Scheduler) ---
    const getISTTimeDetails = () => {
      const cur = new Date();
      const offset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(cur.getTime() + offset);
      const yyyy = istDate.getUTCFullYear();
      const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(istDate.getUTCDate()).padStart(2, '0');
      const hh = String(istDate.getUTCHours()).padStart(2, '0');
      const min = String(istDate.getUTCMinutes()).padStart(2, '0');
      return { dateStr: `${yyyy}-${mm}-${dd}`, timeStr: `${hh}:${min}`, dateTimeStr: `${yyyy}-${mm}-${dd} ${hh}:${min}` };
    };

    const formatDateYmd = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const nowIST = getISTTimeDetails();
    const activeReminders = await db.all("SELECT * FROM reminders WHERE status != 'done'");

    for (const rem of activeReminders) {
      if (rem.snooze_until) {
        if (nowIST.dateTimeStr >= rem.snooze_until) {
          await db.run('UPDATE reminders SET snooze_until = NULL WHERE id = $1', [rem.id]);
          if (rem.email_notify === 1) { await sendReminderNotification(rem, 'alert').catch(console.error); }
          io.emit('tasks_updated');
        }
        continue;
      }

      const scheduledDateTimeStr = `${rem.reminder_date} ${rem.reminder_time}`;
      const currentISTSecs = new Date(nowIST.dateTimeStr.replace(' ', 'T')).getTime();
      const scheduledISTSecs = new Date(scheduledDateTimeStr.replace(' ', 'T')).getTime();
      const diffMin = Math.floor((scheduledISTSecs - currentISTSecs) / 60000);

      if (rem.notify_1hour === 1 && rem.pre_1hour_sent === 0 && diffMin <= 60 && diffMin > 15) {
        await db.run("UPDATE reminders SET pre_1hour_sent = 1, status = 'due_soon' WHERE id = $1", [rem.id]);
        if (rem.email_notify === 1) { await sendReminderNotification({ ...rem, status: 'due_soon' }, 'alert').catch(console.error); }
        io.emit('tasks_updated');
      }
      
      if (rem.notify_15min === 1 && rem.pre_15min_sent === 0 && diffMin <= 15 && diffMin > 0) {
        await db.run("UPDATE reminders SET pre_15min_sent = 1, status = 'due_soon' WHERE id = $1", [rem.id]);
        if (rem.email_notify === 1) { await sendReminderNotification({ ...rem, status: 'due_soon' }, 'alert').catch(console.error); }
        io.emit('tasks_updated');
      }

      if (rem.reminder_sent === 0 && diffMin <= 0 && diffMin > -10) {
        await db.run("UPDATE reminders SET reminder_sent = 1, status = 'due_soon' WHERE id = $1", [rem.id]);
        if (rem.email_notify === 1) { await sendReminderNotification({ ...rem, status: 'due_soon' }, 'alert').catch(console.error); }
        io.emit('tasks_updated');

        if (rem.repeat_type !== 'once') {
          let nextDate = new Date(rem.reminder_date);
          if (rem.repeat_type === 'daily') nextDate.setDate(nextDate.getDate() + 1);
          else if (rem.repeat_type === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
          else if (rem.repeat_type === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
          else nextDate.setDate(nextDate.getDate() + 1);
          const nextDateStr = formatDateYmd(nextDate);
          await db.run(`UPDATE reminders SET reminder_date = $1, reminder_sent = 0, pre_15min_sent = 0, pre_1hour_sent = 0, overdue_sent = 0, status = 'upcoming' WHERE id = $2`, [nextDateStr, rem.id]);
          io.emit('tasks_updated');
        }
      }

      if (rem.overdue_sent === 0 && diffMin <= -10) {
        await db.run("UPDATE reminders SET overdue_sent = 1, status = 'overdue' WHERE id = $1", [rem.id]);
        if (rem.email_notify === 1) { await sendReminderNotification({ ...rem, status: 'overdue' }, 'overdue').catch(console.error); }
        io.emit('tasks_updated');
      }
    }

  } catch (err) {
    console.error('Error in cron job', err);
  }
});

// Serve frontend in production (for Railway/Hosting)
const fs = require('fs');
const frontendDist = path.join(__dirname, '../frontend/dist');

if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
  app.use(express.static(frontendDist));
  // Safely handle all other routes (React Router)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Railway Backend Working 🚀. Frontend build not found.');
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// ── Reliability: keep the server alive & fail with a clear message ──
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught Exception (server stays up):', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('⚠️  Unhandled Rejection (server stays up):', reason);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${port} is already in use — another backend instance is still running.`);
    console.error(`   Run this, then start again:\n     lsof -ti :${port} | xargs kill\n`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

const shutdown = (signal) => {
  console.log(`\n${signal} received — closing server & database...`);
  server.close(() => {
    try { db.pool.end(); } catch (e) { /* ignore */ }
    console.log('Closed cleanly.');
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ── Start: init DB then listen ──
console.log('Initializing database...');
initDb().then(() => {
  console.log('DB initialized. Starting server.listen()...');
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}).catch((err) => {
  console.error('❌ Failed to initialize database:', err.message);
  console.error('   Make sure DATABASE_URL is set (Railway injects it automatically).');
  process.exit(1);
});
