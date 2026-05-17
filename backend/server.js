console.log("Starting...");
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const db = require('./database');
const sendEmail = require('./utils/email');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

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

// Redis setup for Socket.io adapter and caching
if (process.env.REDIS_URL || process.env.REDISPROXY_URL) {
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
console.log('Finished loading routes.');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/projects', projectRoutes);

// Cron Job for Event Reminders (Checks every minute)
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    // Look ahead 2 hours
    const reminderTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const dateStr = reminderTime.toISOString().split('T')[0];
    
    // We fetch events where event_date is today or later, and reminder not sent
    // We can do it in JS to handle timezone logic easily
    const events = db.prepare('SELECT * FROM events WHERE reminder_sent = 0').all();
    
    for (const event of events) {
      // event.event_date is 'YYYY-MM-DD', event.event_time is 'HH:MM'
      const eventDateTime = new Date(`${event.event_date}T${event.event_time}`);
      
      const diffMs = eventDateTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      
      // If event is exactly or less than 120 minutes away, but greater than 0, send reminder
      if (diffMinutes > 0 && diffMinutes <= 120) {
        db.prepare('UPDATE events SET reminder_sent = 1 WHERE id = ?').run(event.id);
        await sendEmail({
          to: 'kunjbhuva301@gmail.com',
          subject: `Reminder: ${event.title} starts in 2 hours!`,
          text: `Reminder: Your event "${event.title}" is scheduled to start at ${event.event_time} on ${event.event_date}.`
        });
      }
    }
  } catch (err) {
    console.error('Error in cron job', err);
  }
});

// Serve frontend in production (for Railway/Hosting)
const fs = require('fs');
const frontendDist = path.join(__dirname, '../frontend/dist');

if (fs.existsSync(frontendDist)) {
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

console.log('Starting server.listen()...');
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
