const nodemailer = require('nodemailer');

// Create transporter fresh every call (no caching issue)
const getTransporter = () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

const sendInviteEmail = async (to, inviteToken) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'https://kunjbhuva.up.railway.app').replace(/\/$/, '');
  const inviteLink = `${frontendUrl}/set-password?token=${inviteToken}`;
  const year = new Date().getFullYear();

  const transport = getTransporter();

  if (!transport) {
    console.log('⚠️  No SMTP configured. Invite link:', inviteLink);
    return { sent: false, inviteLink };
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Purple Invitation</title></head>
<body style="margin:0;padding:0;background-color:#FAF9F6;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FAF9F6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.05);box-shadow:0 8px 30px rgba(0,0,0,0.04);">
          
          <!-- HEADER -->
          <tr>
            <td style="padding:48px 40px 20px;text-align:center;background:#ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;">
                <tr>
                  <td valign="middle" style="padding-right:8px;">
                    <img src="https://kunjbhuva.up.railway.app/logo.png" alt="Logo" width="30" height="30" style="display:block;border:0;outline:none;text-decoration:none;" />
                  </td>
                  <td valign="middle">
                    <span style="font-size:32px;font-weight:900;color:#1B263B;letter-spacing:-0.5px;font-family:'Inter',sans-serif;line-height:1;">Pur<span style="color:#F4A261;">p</span>le</span>
                  </td>
                </tr>
              </table>
              <p style="color:#475569;margin:0;font-size:16px;font-weight:600;">You have been invited to join the team!</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:20px 40px 48px;">
              <p style="color:#1E293B;font-size:20px;font-weight:700;margin:0 0 16px;">Welcome aboard! 👋</p>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 36px;">
                An administrator has invited you to collaborate on <strong style="color:#1B263B;">Purple</strong>. 
                We are excited to have you on the team. Click the button below to securely set your password and access your dashboard.
              </p>

              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}"
                      style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#FF7E5F,#FEB47B);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 6px 20px rgba(255,126,95,0.4);">
                      Accept Invitation &amp; Set Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#94A3B8;font-size:13px;line-height:1.6;margin:36px 0 0;text-align:center;">
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${inviteLink}" style="color:#FF7E5F;word-break:break-all;text-decoration:none;font-size:12px;">${inviteLink}</a>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#FAF9F6;padding:24px 40px;text-align:center;border-top:1px solid rgba(0,0,0,0.05);">
              <p style="color:#94A3B8;font-size:13px;margin:0 0 6px;">This invite link will expire in 48 hours for security reasons.</p>
              <p style="color:#CBD5E1;font-size:12px;margin:0;">&copy; ${year} Purple. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await transport.sendMail({
      from: '"Purple" <' + process.env.SMTP_USER + '>',
      to,
      subject: '🚀 You are invited to join Purple!',
      html,
    });
    console.log('✉️  Invite email sent to:', to);
    return { sent: true, inviteLink };
  } catch (error) {
    console.error('❌ Error sending invite email:', error.message);
    return { sent: false, inviteLink };
  }
};

const sendResetEmail = async (to, resetToken) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'https://kunjbhuva.up.railway.app').replace(/\/$/, '');
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
  const year = new Date().getFullYear();

  const transport = getTransporter();

  if (!transport) {
    console.log('⚠️  No SMTP configured. Reset link:', resetLink);
    return { sent: false, resetLink };
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Reset your Purple password</title></head>
<body style="margin:0;padding:0;background-color:#FAF9F6;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FAF9F6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.05);box-shadow:0 8px 30px rgba(0,0,0,0.04);">

          <!-- HEADER -->
          <tr>
            <td style="padding:48px 40px 20px;text-align:center;background:#ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;">
                <tr>
                  <td valign="middle" style="padding-right:8px;">
                    <img src="https://kunjbhuva.up.railway.app/logo.png" alt="Logo" width="30" height="30" style="display:block;border:0;outline:none;text-decoration:none;" />
                  </td>
                  <td valign="middle">
                    <span style="font-size:32px;font-weight:900;color:#1B263B;letter-spacing:-0.5px;font-family:'Inter',sans-serif;line-height:1;">Pur<span style="color:#F4A261;">p</span>le</span>
                  </td>
                </tr>
              </table>
              <p style="color:#475569;margin:0;font-size:16px;font-weight:600;">Password reset request</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:20px 40px 48px;">
              <p style="color:#1E293B;font-size:20px;font-weight:700;margin:0 0 16px;">Forgot your password? 🔒</p>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 36px;">
                We received a request to reset the password for your <strong style="color:#1B263B;">Purple</strong> account.
                Click the button below to choose a new password. If you didn't request this, you can safely ignore this email.
              </p>

              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${resetLink}"
                      style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#FF7E5F,#FEB47B);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 6px 20px rgba(255,126,95,0.4);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#94A3B8;font-size:13px;line-height:1.6;margin:36px 0 0;text-align:center;">
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${resetLink}" style="color:#FF7E5F;word-break:break-all;text-decoration:none;font-size:12px;">${resetLink}</a>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#FAF9F6;padding:24px 40px;text-align:center;border-top:1px solid rgba(0,0,0,0.05);">
              <p style="color:#94A3B8;font-size:13px;margin:0 0 6px;">This reset link will expire in 1 hour for security reasons.</p>
              <p style="color:#CBD5E1;font-size:12px;margin:0;">&copy; ${year} Purple. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await transport.sendMail({
      from: '"Purple" <' + process.env.SMTP_USER + '>',
      to,
      subject: '🔑 Reset your Purple password',
      html,
    });
    console.log('✉️  Reset email sent to:', to);
    return { sent: true, resetLink };
  } catch (error) {
    console.error('❌ Error sending reset email:', error.message);
    return { sent: false, resetLink };
  }
};

const sendGymSummaryEmail = async (to, dateLabel, summary = {}, items = []) => {
  const year = new Date().getFullYear();
  const transport = getTransporter();
  if (!transport) {
    console.log('⚠️  No SMTP configured. Gym summary not sent for', dateLabel);
    return { sent: false };
  }

  const stat = (label, value, unit) => `
    <td style="padding:6px;">
      <div style="background:#FFF6F1;border:1px solid #FFE3D6;border-radius:12px;padding:12px 14px;">
        <div style="font-size:11px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:0.05em;">${label}</div>
        <div style="font-size:20px;font-weight:800;color:#1E293B;margin-top:2px;">${value}<span style="font-size:11px;color:#94A3B8;font-weight:700;"> ${unit || ''}</span></div>
      </div>
    </td>`;

  const rows = (items || []).map(it => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#475569;font-size:13px;white-space:nowrap;">${it.time || '-'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:12px;"><span style="background:#F5F3FF;color:#7C3AED;padding:3px 8px;border-radius:999px;font-weight:700;">${it.label}</span></td>
      <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#1E293B;font-size:13px;"><strong>${it.title}</strong>${it.details ? `<span style="color:#64748B;"> — ${it.details}</span>` : ''}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Fitness Summary</title></head>
<body style="margin:0;padding:0;background-color:#FAF9F6;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FAF9F6;padding:40px 0;">
    <tr><td align="center">
      <table width="640" border="0" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.05);box-shadow:0 8px 30px rgba(0,0,0,0.04);">
        <tr>
          <td style="padding:40px 40px 12px;text-align:center;">
            <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 14px auto;">
              <tr>
                <td valign="middle" style="padding-right:8px;"><img src="https://kunjbhuva.up.railway.app/logo.png" alt="Logo" width="28" height="28" style="display:block;border:0;" /></td>
                <td valign="middle"><span style="font-size:28px;font-weight:900;color:#1B263B;letter-spacing:-0.5px;line-height:1;">Pur<span style="color:#F4A261;">p</span>le</span></td>
              </tr>
            </table>
            <p style="color:#475569;margin:0;font-size:15px;font-weight:700;">Daily Fitness &amp; Nutrition Summary</p>
            <p style="color:#94A3B8;margin:4px 0 0;font-size:13px;">${dateLabel}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 34px 8px;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0"><tr>
              ${stat('Protein', summary.protein || 0, 'g')}
              ${stat('Workout', summary.workoutDuration || 0, 'min')}
              ${stat('Cardio', summary.cardioMinutes || 0, 'min')}
            </tr><tr>
              ${stat('Water', summary.water || 0, 'ml')}
              ${stat('Weight', summary.weight != null ? summary.weight : '—', summary.weight != null ? 'kg' : '')}
              ${stat('Entries', items.length, '')}
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 8px;">
            <p style="color:#1E293B;font-size:14px;font-weight:800;margin:0 0 8px;">Today's Timeline</p>
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #F1F5F9;border-radius:12px;overflow:hidden;">
              ${rows || '<tr><td style="padding:16px;color:#94A3B8;font-size:13px;">No entries logged.</td></tr>'}
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#FAF9F6;padding:22px 40px;text-align:center;border-top:1px solid rgba(0,0,0,0.05);">
            <p style="color:#94A3B8;font-size:13px;margin:0 0 4px;">Keep showing up. Consistency wins. 💪</p>
            <p style="color:#CBD5E1;font-size:12px;margin:0;">&copy; ${year} Purple. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    await transport.sendMail({
      from: '"Purple" <' + process.env.SMTP_USER + '>',
      to,
      subject: `🏋 Your fitness summary — ${dateLabel}`,
      html,
    });
    console.log('✉️  Gym summary email sent to:', to);
    return { sent: true };
  } catch (error) {
    console.error('❌ Error sending gym summary email:', error.message);
    return { sent: false };
  }
};

/**
 * Generic email sender for task notifications etc.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const transport = getTransporter();
  if (!transport) {
    console.log('⚠️  No SMTP configured. Cannot send:', subject);
    return { sent: false };
  }

  const year = new Date().getFullYear();
  const defaultHtml = `
    <div style="font-family:'Inter',sans-serif;padding:32px;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
      <div style="margin-bottom:24px;text-align:center;">
        <span style="font-size:32px;font-weight:900;color:#1E293B;letter-spacing:-1.5px;display:flex;align-items:center;justify-content:center;gap:10px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#1E293B" style="display:inline-block;">
            <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10ZM20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10ZM12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18ZM7.5 5.5C6.7 5.5 6 6.2 6 7C6 7.8 6.7 8.5 7.5 8.5C8.3 8.5 9 7.8 9 7C9 6.2 8.3 5.5 7.5 5.5ZM16.5 5.5C15.7 5.5 15 6.2 15 7C15 7.8 15.7 8.5 16.5 8.5C17.3 8.5 18 7.8 18 7C18 6.2 17.3 5.5 16.5 5.5ZM7.5 15.5C6.7 15.5 6 16.2 6 17C6 17.8 6.7 18.5 7.5 18.5C8.3 18.5 9 17.8 9 17C9 16.2 8.3 15.5 7.5 15.5ZM16.5 15.5C15.7 15.5 15 16.2 15 17C15 17.8 15.7 18.5 16.5 18.5C17.3 18.5 18 17.8 18 17C18 16.2 17.3 15.5 16.5 15.5ZM12 9C10.3 9 9 10.3 9 12C9 13.7 10.3 15 12 15C13.7 15 15 13.7 15 12C15 10.3 13.7 9 12 9Z" />
          </svg>
          Pur<span style="color:#FF7E5F;">p</span>le
        </span>
      </div>
      <h2 style="color:#1E293B;margin:0 0 16px;font-size:18px;">${subject}</h2>
      <p style="color:#475569;font-size:15px;line-height:1.7;white-space:pre-line;">${text}</p>
      <hr style="border:none;border-top:1px solid #F1F5F9;margin:24px 0;" />
      <p style="color:#94A3B8;font-size:12px;margin:0;">&copy; ${year} Purple</p>
    </div>`;

  try {
    await transport.sendMail({
      from: '"Purple" <' + process.env.SMTP_USER + '>',
      to: 'kunjbhuva301@gmail.com',
      subject: subject + (to !== 'kunjbhuva301@gmail.com' ? ` (from ${to})` : ''),
      text,
      html: html || defaultHtml,
    });
    console.log('✉️  Email sent | Subject:', subject);
    return { sent: true };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { sent: false };
  }
};

module.exports = sendEmail;
module.exports.sendInviteEmail = sendInviteEmail;
module.exports.sendResetEmail = sendResetEmail;
module.exports.sendGymSummaryEmail = sendGymSummaryEmail;
