const sendEmail = require('./email');

// Soft category styling for HTML email badges
const getCategoryEmailStyle = (category = 'Other') => {
  const styles = {
    Server:   { emoji: '🖥️', bg: '#EFF6FF', color: '#1E40AF' },
    DevOps:   { emoji: '⚙️', bg: '#F5F3FF', color: '#6D28D9' },
    Bill:     { emoji: '💳', bg: '#ECFDF5', color: '#047857' },
    Meeting:  { emoji: '👥', bg: '#EFF6FF', color: '#1D4ED8' },
    Personal: { emoji: '🏠', bg: '#FFF1F2', color: '#BE123C' },
    Other:    { emoji: '📌', bg: '#FFF7ED', color: '#C2410C' }
  };
  return styles[category] || styles.Other;
};

// Soft priority styling for badges
const getPriorityEmailStyle = (priority = 'medium') => {
  const styles = {
    low:    { emoji: '🟢', bg: '#F0FDF4', color: '#15803D' },
    medium: { emoji: '🟡', bg: '#FEF3C7', color: '#B45309' },
    high:   { emoji: '🔴', bg: '#FEF2F2', color: '#B91C1C' }
  };
  return styles[priority.toLowerCase()] || styles.medium;
};

// Format scheduled date to readable string
const formatReadableDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const sendReminderNotification = async (reminder, type = 'created') => {
  const { id, title, description, reminder_date, reminder_time, priority, repeat_type, category } = reminder;

  // Resolve Base URLs dynamically for local / production redirection
  const frontendBase = (process.env.FRONTEND_URL || 'https://task-board-production-app.up.railway.app').replace(/\/$/, '');
  const apiBase = frontendBase.includes('localhost') ? 'http://localhost:5005/api' : `${frontendBase}/api`;

  const doneLink = `${apiBase}/reminders/${id}/complete-email`;
  const snoozeLink = `${apiBase}/reminders/${id}/snooze-email?minutes=30`;
  const openLink = `${frontendBase}/user/reminders`;

  const now = new Date();
  
  // Format current IST time
  const dateOptions = { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' };
  const formattedDate = now.toLocaleDateString('en-IN', dateOptions);
  const timeOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true };
  const formattedTime = now.toLocaleTimeString('en-IN', timeOptions).toUpperCase();
  const istDateTime = `${formattedDate} • ${formattedTime} IST`;

  const formattedReminderDate = formatReadableDate(reminder_date);
  const formattedReminderTime = reminder_time; // Already saved in HH:MM format

  const catStyle = getCategoryEmailStyle(category);
  const prioStyle = getPriorityEmailStyle(priority);

  // Status-specific text + a single soft accent (kept minimal — no loud gradients)
  const logoUrl = `${frontendBase}/logo.png`;
  const year = new Date().getFullYear();
  let headerTitle = 'Reminder Notification';
  let statusEmoji = '🔔';
  let statusText = 'Notification';
  let accent = '#475569';    // neutral slate (default)
  let accentBg = '#F1F5F9';

  if (type === 'created') {
    headerTitle = 'Reminder Scheduled';
    statusEmoji = '✅'; statusText = 'Saved successfully';
    accent = '#0F766E'; accentBg = '#ECFDF5';
  } else if (type === 'alert') {
    headerTitle = 'Reminder';
    statusEmoji = '⏰'; statusText = "It's time for your task";
    accent = '#B45309'; accentBg = '#FEF3C7';
  } else if (type === 'overdue') {
    headerTitle = 'Overdue Reminder';
    statusEmoji = '⚠️'; statusText = 'Missed deadline';
    accent = '#B91C1C'; accentBg = '#FEF2F2';
  } else if (type === 'completed') {
    headerTitle = 'Reminder Completed';
    statusEmoji = '🎉'; statusText = 'Marked as done';
    accent = '#15803D'; accentBg = '#F0FDF4';
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin:0; padding:0; background-color:#F8F6F3; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F8F6F3; padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:24px; overflow:hidden; border:1px solid rgba(0,0,0,0.04); box-shadow:0 12px 40px rgba(0,0,0,0.03);">
          
          <!-- thin accent strip — subtle type indicator only -->
          <tr><td style="height:4px; background:${accent}; font-size:0; line-height:0;">&nbsp;</td></tr>

          <!-- 1) Clean header: Helios wordmark -->
          <tr>
            <td style="background:#ffffff; padding:32px 32px 6px; text-align:center;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
                <tr>
                  <td valign="middle" style="padding-right:8px;">
                    <img src="${logoUrl}" alt="Helios" width="26" height="26" style="display:block; border:0; outline:none; text-decoration:none;" />
                  </td>
                  <td valign="middle">
                    <span style="font-size:24px; font-weight:900; color:#1B263B; letter-spacing:-0.5px; font-family:sans-serif; line-height:1;">Helios</span>
                  </td>
                </tr>
              </table>
              <h1 style="color:#1E293B; font-size:20px; font-weight:800; margin:0; font-family:sans-serif; letter-spacing:-0.3px;">${headerTitle}</h1>
            </td>
          </tr>

          <!-- 2) Status pill -->
          <tr>
            <td style="background:#ffffff; padding:10px 32px 4px; text-align:center;">
              <span style="display:inline-block; padding:5px 12px; background:${accentBg}; color:${accent}; border-radius:999px; font-size:12px; font-weight:700; font-family:sans-serif;">
                ${statusEmoji} ${statusText}
              </span>
            </td>
          </tr>

          <!-- 3) Main Body Content -->
          <tr>
            <td style="padding:40px 32px 24px;">
              <h2 style="color:#1E293B; font-size:18px; font-weight:800; margin:0 0 8px; font-family:sans-serif; text-align:left;">
                ${title}
              </h2>
              <p style="color:#475569; font-size:15px; line-height:1.6; margin:0 0 24px; font-family:sans-serif; text-align:left;">
                ${description || '<span style="color:#94A3B8; font-style:italic;">No description provided.</span>'}
              </p>

              <!-- 4) Detail Badges Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#FAF9F6; border-radius:16px; border:1px solid #E2E8F0; margin-bottom:32px; overflow:hidden;">
                <tr>
                  <td style="padding:14px 18px; border-bottom:1px solid #E2E8F0; width:35%; font-size:13px; font-weight:600; color:#64748B; text-align:left; font-family:sans-serif;">Scheduled Date</td>
                  <td style="padding:14px 18px; border-bottom:1px solid #E2E8F0; font-size:13px; font-weight:700; color:#1E293B; text-align:left; font-family:sans-serif;">${formattedReminderDate}</td>
                </tr>
                <tr>
                  <td style="padding:14px 18px; border-bottom:1px solid #E2E8F0; font-size:13px; font-weight:600; color:#64748B; text-align:left; font-family:sans-serif;">Scheduled Time</td>
                  <td style="padding:14px 18px; border-bottom:1px solid #E2E8F0; font-size:13px; font-weight:700; color:#1E293B; text-align:left; font-family:sans-serif;">${formattedReminderTime} IST</td>
                </tr>
                <tr>
                  <td style="padding:14px 18px; border-bottom:1px solid #E2E8F0; font-size:13px; font-weight:600; color:#64748B; text-align:left; font-family:sans-serif;">Category</td>
                  <td style="padding:14px 18px; border-bottom:1px solid #E2E8F0; text-align:left; font-family:sans-serif;">
                    <span style="display:inline-block; padding:3px 8px; background-color:${catStyle.bg}; color:${catStyle.color}; border-radius:20px; font-size:12px; font-weight:700; white-space:nowrap;">
                      ${catStyle.emoji} ${category}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 18px; border-bottom:1px solid #E2E8F0; font-size:13px; font-weight:600; color:#64748B; text-align:left; font-family:sans-serif;">Priority</td>
                  <td style="padding:14px 18px; border-bottom:1px solid #E2E8F0; text-align:left; font-family:sans-serif;">
                    <span style="display:inline-block; padding:3px 8px; background-color:${prioStyle.bg}; color:${prioStyle.color}; border-radius:20px; font-size:12px; font-weight:700; white-space:nowrap; text-transform:capitalize;">
                      ${prioStyle.emoji} ${priority}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 18px; font-size:13px; font-weight:600; color:#64748B; text-align:left; font-family:sans-serif;">Repeat Schedule</td>
                  <td style="padding:14px 18px; font-size:13px; font-weight:700; color:#1E293B; text-align:left; font-family:sans-serif; text-transform:capitalize;">🔄 ${repeat_type}</td>
                </tr>
              </table>

              <!-- 5) Action Buttons / CTAs -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0" style="width:100%;">
                      <tr>
                        <!-- Done CTA (Show only for active/created alerts) -->
                        ${type !== 'completed' ? `
                        <td align="center" style="width:48%; padding-right:4%;">
                          <a href="${doneLink}" style="display:block; text-align:center; padding:13px; background-color:#1B263B; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; border-radius:10px; font-family:sans-serif;">
                            Mark as Done ✓
                          </a>
                        </td>
                        <td align="center" style="width:48%;">
                          <a href="${snoozeLink}" style="display:block; text-align:center; padding:13px; background-color:#ffffff; color:#475569; font-weight:700; font-size:14px; text-decoration:none; border-radius:10px; border:1px solid #E2E8F0; font-family:sans-serif;">
                            Snooze 30 Min
                          </a>
                        </td>
                        ` : `
                        <td align="center" style="width:100%;">
                          <a href="${openLink}" style="display:block; text-align:center; padding:13px; background-color:#1B263B; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; border-radius:10px; font-family:sans-serif;">
                            Open Dashboard
                          </a>
                        </td>
                        `}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${type !== 'completed' ? `
              <div style="text-align:center; margin-top:20px;">
                <a href="${openLink}" style="font-size:13px; font-weight:600; color:#475569; text-decoration:none; font-family:sans-serif;">Open Reminders Page →</a>
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- 6) Footer -->
          <tr>
            <td style="background-color:#F8F6F3; padding:22px 32px; text-align:center; border-top:1px solid rgba(0,0,0,0.05);">
              <p style="color:#94A3B8; font-size:12px; margin:0 0 4px; font-family:sans-serif;">Generated on ${istDateTime}</p>
              <p style="color:#94A3B8; font-size:11px; margin:0; font-family:sans-serif;">&copy; ${year} Helios &middot; kunjtech.in</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Send the email
  const subjectPrefix = type === 'created' ? '✅ Scheduled' : type === 'alert' ? '⏰ Alert' : type === 'overdue' ? '⚠️ Overdue' : '🎉 Done';
  const mailSubject = `${subjectPrefix}: ${title} (${category})`;

  await sendEmail({
    to: 'kunjbhuva301@gmail.com',
    subject: mailSubject,
    text: `${title} - ${description || ''}\nScheduled for: ${formattedReminderDate} at ${formattedReminderTime} IST\nCategory: ${category}\nPriority: ${priority}`,
    html
  });
};

module.exports = {
  sendReminderNotification
};
