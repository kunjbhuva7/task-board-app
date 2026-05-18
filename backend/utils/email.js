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
            <td style="background:linear-gradient(135deg,#FF7E5F 0%,#FEB47B 100%);padding:48px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.25);border-radius:16px;padding:12px 28px;margin-bottom:16px;">
                <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px;font-family:'Inter',sans-serif;">Purple</span>
              </div>
              <p style="color:rgba(255,255,255,0.95);margin:0;font-size:16px;font-weight:500;">You have been invited to join the team!</p>
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
      <div style="background:linear-gradient(135deg,#FF7E5F,#FEB47B);padding:20px 24px;border-radius:12px;margin-bottom:24px;">
        <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Purple</span>
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
