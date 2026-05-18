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
<body style="margin:0;padding:0;background-color:#FFF5F2;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#FFF5F2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(255,126,95,0.12);">
          
          <!-- HEADER -->
          <tr>
            <td style="padding:48px 40px 10px;text-align:center;background:#ffffff;">
              <div style="display:inline-block;margin-bottom:16px;">
                <span style="font-size:36px;font-weight:900;color:#1E293B;letter-spacing:-1.5px;font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#1E293B" style="display:inline-block;">
                    <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10ZM20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10ZM12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18ZM7.5 5.5C6.7 5.5 6 6.2 6 7C6 7.8 6.7 8.5 7.5 8.5C8.3 8.5 9 7.8 9 7C9 6.2 8.3 5.5 7.5 5.5ZM16.5 5.5C15.7 5.5 15 6.2 15 7C15 7.8 15.7 8.5 16.5 8.5C17.3 8.5 18 7.8 18 7C18 6.2 17.3 5.5 16.5 5.5ZM7.5 15.5C6.7 15.5 6 16.2 6 17C6 17.8 6.7 18.5 7.5 18.5C8.3 18.5 9 17.8 9 17C9 16.2 8.3 15.5 7.5 15.5ZM16.5 15.5C15.7 15.5 15 16.2 15 17C15 17.8 15.7 18.5 16.5 18.5C17.3 18.5 18 17.8 18 17C18 16.2 17.3 15.5 16.5 15.5ZM12 9C10.3 9 9 10.3 9 12C9 13.7 10.3 15 12 15C13.7 15 15 13.7 15 12C15 10.3 13.7 9 12 9Z" />
                  </svg>
                  Pur<span style="color:#FF7E5F;">p</span>le
                </span>
              </div>
              <p style="color:#475569;margin:0;font-size:16px;font-weight:600;">You have been invited to join the team!</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:48px 40px;">
              <p style="color:#1E293B;font-size:20px;font-weight:700;margin:0 0 16px;">Welcome aboard! 👋</p>
              <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 36px;">
                An administrator has invited you to collaborate on <strong style="color:#FF7E5F;">Purple</strong>. 
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
            <td style="background:#FFF5F2;padding:24px 40px;text-align:center;border-top:1px solid #FFE4DC;">
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
