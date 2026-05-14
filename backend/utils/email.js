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
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const inviteLink = `${frontendUrl}/set-password?token=${inviteToken}`;

  const transport = await getTransporter();

  if (!transport) {
    console.log('⚠️  Email transport not available. Invite link:', inviteLink);
    return { sent: false, inviteLink };
  }

  const mailOptions = {
    from: '"TaskBoard Admin" <admin@taskboard.local>',
    to,
    subject: '🚀 You are invited to join TaskBoard!',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
          <div style="background:linear-gradient(135deg,#2563EB,#1D4ED8);padding:32px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;">✅ TaskBoard</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">You've been invited!</p>
          </div>
          <div style="padding:32px;">
            <p style="color:#0F172A;font-size:16px;line-height:1.6;">Hello,</p>
            <p style="color:#475569;font-size:15px;line-height:1.6;">You have been invited to join <strong>TaskBoard</strong>. Click the button below to set your password and get started:</p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${inviteLink}" style="display:inline-block;padding:14px 32px;background:#2563EB;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Set My Password</a>
            </div>
            <p style="color:#94A3B8;font-size:13px;line-height:1.5;">If the button doesn't work, copy and paste this link:<br/><a href="${inviteLink}" style="color:#2563EB;word-break:break-all;">${inviteLink}</a></p>
            <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;"/>
            <p style="color:#94A3B8;font-size:12px;">This invite link will expire in 48 hours.</p>
          </div>
        </div>
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

module.exports = { sendInviteEmail };
