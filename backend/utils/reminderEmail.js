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
  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
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

  // Status-specific template variables
  let headerTitle = 'Reminder Notification';
  let headerGradient = 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'; // Purple/Indigo
  let statusEmoji = '🔔';
  let statusText = 'Purple Alert';

  if (type === 'created') {
    headerTitle = 'Reminder Scheduled';
    headerGradient = 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'; // Purple/Pink
    statusEmoji = '✅';
    statusText = 'Reminder Saved Successfully';
  } else if (type === 'alert') {
    headerTitle = 'Reminder Alert!';
    headerGradient = 'linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)'; // Orange/Warm Accent
    statusEmoji = '⏰';
    statusText = 'It is time for your task';
  } else if (type === 'overdue') {
    headerTitle = 'Overdue Reminder Alert!';
    headerGradient = 'linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)'; // Red/Yellow Warning
    statusEmoji = '⚠️';
    statusText = 'Missed Deadline Alert';
  } else if (type === 'completed') {
    headerTitle = 'Reminder Completed';
    headerGradient = 'linear-gradient(135deg, #10B981 0%, #059669 100%)'; // Green Success
    statusEmoji = '🎉';
    statusText = 'Task Marked as Done';
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF9F6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FAF9F6; padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:24px; overflow:hidden; border:1px solid rgba(0,0,0,0.04); box-shadow:0 12px 40px rgba(0,0,0,0.03);">
          
          <!-- 1) Header Banner with Logo & App Name -->
          <tr>
            <td style="background:${headerGradient}; padding:40px 32px 32px; text-align:center;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                <tr>
                  <td valign="middle" style="padding-right:8px;">
                    <img src="https://kunjbhuva.up.railway.app/logo.png" alt="Logo" width="28" height="28" style="display:block; border:0; outline:none; text-decoration:none;" />
                  </td>
                  <td valign="middle">
                    <span style="font-size:28px; font-weight:900; color:#FFFFFF; letter-spacing:-0.5px; font-family:sans-serif; line-height:1;">Pur<span style="color:#FEB47B;">p</span>le</span>
                  </td>
                </tr>
              </table>
              <h1 style="color:#FFFFFF; font-size:22px; font-weight:800; margin:0; font-family:sans-serif; letter-spacing:-0.5px;">${headerTitle}</h1>
            </td>
          </tr>

          <!-- 2) Status Banner -->
          <tr>
            <td style="background-color:#FAF9F6; padding:12px 32px; text-align:center; border-bottom:1px solid rgba(0,0,0,0.03);">
              <span style="font-size:14px; font-weight:700; color:#475569; font-family:sans-serif;">
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
                          <a href="${doneLink}" style="display:block; text-align:center; padding:14px; background-color:#10B981; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; border-radius:10px; box-shadow:0 4px 12px rgba(16,185,129,0.25); font-family:sans-serif;">
                            Mark as Done ✓
                          </a>
                        </td>
                        <td align="center" style="width:48%;">
                          <a href="${snoozeLink}" style="display:block; text-align:center; padding:14px; background-color:#F59E0B; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; border-radius:10px; box-shadow:0 4px 12px rgba(245,158,11,0.25); font-family:sans-serif;">
                            Snooze 30 Min ⏰
                          </a>
                        </td>
                        ` : `
                        <td align="center" style="width:100%;">
                          <a href="${openLink}" style="display:block; text-align:center; padding:14px; background-color:#8B5CF6; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; border-radius:10px; box-shadow:0 4px 12px rgba(139,92,246,0.25); font-family:sans-serif;">
                            Open Dashboard 🚀
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
                <a href="${openLink}" style="font-size:13px; font-weight:600; color:#8B5CF6; text-decoration:none; font-family:sans-serif;">Open Reminders Page →</a>
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- 6) Footer Metadata -->
          <tr>
            <td style="background-color:#FAF9F6; padding:24px 32px; text-align:center; border-top:1px solid rgba(0,0,0,0.04);">
              <p style="color:#64748B; font-size:12px; margin:0 0 4px; font-weight:600; font-family:sans-serif; text-transform:uppercase; letter-spacing:0.5px;">SYSTEM ALERT TIMELINE</p>
              <p style="color:#94A3B8; font-size:12px; margin:0 0 16px; font-family:sans-serif;">Generated on ${istDateTime}</p>
              <div style="width:40px; height:1px; background-color:#E2E8F0; margin:0 auto 16px;"></div>
              <p style="color:#94A3B8; font-size:11px; margin:0; font-family:sans-serif;">Purple Reminder Engine • Automated server management task scheduler.</p>
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
