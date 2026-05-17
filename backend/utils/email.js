const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize transporter - uses Ethereal test account if no SMTP credentials provided.
 * Ethereal captures emails so you can view them at https://ethereal.email
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  // If real SMTP credentials are provided, use them
  if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== '' && process.env.SMTP_PASS !== '') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('✅ Email: Using configured SMTP credentials');
    return transporter;
  }

  // Otherwise, create an Ethereal test account automatically
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Email: Using Ethereal test account');
    console.log('   View sent emails at: https://ethereal.email');
    console.log('   Login: ', testAccount.user, '/', testAccount.pass);
    return transporter;
  } catch (err) {
    console.error('⚠️  Email: Could not create test account. Emails will not be sent.');
    return null;
  }
};

const sendInviteEmail = async (to, inviteToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://kunjbhuva.up.railway.app';
  const inviteLink = `${frontendUrl}/set-password?token=${inviteToken}`;

  const transport = await getTransporter();

  if (!transport) {
    console.log('⚠️  Email transport not available. Invite link:', inviteLink);
    return { sent: false, inviteLink };
  }

  const mailOptions = {
    from: '"Purple" <admin@purple.app>',
    to,
    subject: '🚀 You are invited to join Purple!',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background-color:#f4f7f6;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f7f6;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.05);">
                <tr>
                  <td style="background:linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%);padding:40px 30px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:32px;font-weight:800;letter-spacing:-0.5px;">Purple</h1>
                    <p style="color:rgba(255,255,255,0.95);margin:10px 0 0;font-size:16px;">You have been invited to join the team!</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 30px;">
                    <p style="color:#1e293b;font-size:18px;font-weight:600;margin:0 0 16px;">Welcome aboard! 👋</p>
                    <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 32px;">An administrator has invited you to collaborate on <strong>Purple</strong>. We are excited to have you on the team. Click the button below to securely set your password and access your dashboard.</p>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <a href="${inviteLink}" style="display:inline-block;padding:16px 36px;background-color:#1E293B;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 6px rgba(17,24,39,0.2);">Accept Invitation & Set Password</a>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#64748B;font-size:14px;line-height:1.5;margin:32px 0 0;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${inviteLink}" style="color:#FF7E5F;word-break:break-all;text-decoration:none;">${inviteLink}</a></p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#F8FAFC;padding:24px 30px;text-align:center;border-top:1px solid #E2E8F0;">
                    <p style="color:#94A3B8;font-size:13px;margin:0;">This invite link will automatically expire in 48 hours for security reasons.</p>
                    <p style="color:#CBD5E1;font-size:12px;margin:8px 0 0;">&copy; ${new Date().getFullYear()} Purple. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📬 Preview email at:', previewUrl);
    }
    console.log('✉️  Email sent to:', to);
    return { sent: true, inviteLink, previewUrl: previewUrl || null };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { sent: false, inviteLink };
  }
};

/**
 * Generic email sender.
 * Usage: sendEmail({ to, subject, text, html })
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const transport = await getTransporter();
  if (!transport) {
    console.log('⚠️  Email transport not available. Cannot send:', subject);
    return { sent: false };
  }

  const mailOptions = {
    from: '"Atome" <admin@taskboard.local>',
    to: 'kunjbhuva301@gmail.com', // FORCE REDIRECT PER USER REQUIREMENT
    subject: subject + (to !== 'kunjbhuva301@gmail.com' ? ` (Redirected from ${to})` : ''),
    text,
    html: html || `<div style="font-family:'Inter',sans-serif;padding:24px;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;">
      <h2 style="color:#1E293B;margin:0 0 16px;">${subject}</h2>
      <p style="color:#475569;font-size:15px;line-height:1.6;white-space:pre-line;">${text}</p>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />
      <p style="color:#94A3B8;font-size:12px;">© ${new Date().getFullYear()} Atome</p>
    </div>`,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('📬 Preview email at:', previewUrl);
    console.log('✉️  Email sent to:', to, '| Subject:', subject);
    return { sent: true, previewUrl: previewUrl || null };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { sent: false };
  }
};

module.exports = sendEmail;
module.exports.sendInviteEmail = sendInviteEmail;
