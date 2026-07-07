/**
 * Email Service — Resend API
 * Sender: noreply@kunjtech.in (verified domain: kunjtech.in)
 * Env: RESEND_API_KEY
 */

const { Resend } = require('resend');

const FROM = 'Helios <noreply@kunjtech.in>';
const BRAND_COLOR = '#FF7E5F';
const YEAR = new Date().getFullYear();

let resend = null;
const getResend = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

// ── Base HTML wrapper (consistent premium Helios branding) ──
const baseHtml = (title, bodyContent) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#F8F6F3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F8F6F3;padding:40px 0;">
<tr><td align="center">
<table width="580" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.05);box-shadow:0 8px 30px rgba(0,0,0,0.04);">
  <tr><td style="padding:36px 40px 16px;text-align:center;">
    <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td valign="middle" style="padding-right:8px;"><img src="https://task-board-production-app.up.railway.app/logo.png" alt="Logo" width="28" height="28" style="display:block;border:0;" /></td>
        <td valign="middle"><span style="font-size:26px;font-weight:900;color:#1B263B;letter-spacing:-0.5px;line-height:1;">Helios</span></td>
      </tr>
    </table>
  </td></tr>
  <tr><td style="padding:10px 40px 40px;">${bodyContent}</td></tr>
  <tr><td style="background:#F8F6F3;padding:20px 40px;text-align:center;border-top:1px solid rgba(0,0,0,0.05);">
    <p style="color:#94A3B8;font-size:12px;margin:0;">&copy; ${YEAR} Helios &middot; kunjtech.in</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

const btnHtml = (text, url, color = BRAND_COLOR) => `
<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0;">
<tr><td align="center">
  <a href="${url}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,${color},#FEB47B);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.2px;box-shadow:0 6px 18px rgba(255,126,95,0.3);">${text}</a>
</td></tr>
</table>`;

// ── Core send function ──
const send = async ({ to, subject, html, text }) => {
  const r = getResend();
  if (!r) {
    console.log('⚠️  No RESEND_API_KEY set. Email skipped:', subject);
    return { sent: false, reason: 'no_api_key' };
  }
  try {
    const { data, error } = await r.emails.send({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html: html || undefined, text: text || undefined });
    if (error) {
      console.error('❌ Resend error:', error.message || JSON.stringify(error));
      return { sent: false, error: error.message };
    }
    console.log('✉️  Email sent:', subject, '→', to, '| id:', data?.id);
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    return { sent: false, error: err.message };
  }
};

// ══════════════════════════════════════════════════════════════
// PUBLIC METHODS (used by routes)
// ══════════════════════════════════════════════════════════════

// Generic email
const sendEmail = async ({ to, subject, text, html }) => {
  const finalHtml = html || baseHtml(subject, `<p style="color:#1E293B;font-size:16px;line-height:1.7;margin:0;">${(text || '').replace(/\n/g, '<br/>')}</p>`);
  return send({ to, subject, html: finalHtml, text });
};

// Invite email
const sendInviteEmail = async (to, inviteToken) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'https://task-board-production-app.up.railway.app').replace(/\/$/, '');
  const inviteLink = `${frontendUrl}/set-password?token=${inviteToken}`;
  const html = baseHtml('You are Invited!', `
    <h2 style="color:#1E293B;font-size:22px;font-weight:800;margin:0 0 12px;">You're Invited! 🎉</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 8px;">An administrator has invited you to join <strong>Helios</strong>. Click below to set your password and access your workspace.</p>
    ${btnHtml('Accept Invitation', inviteLink)}
    <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0;">This link expires in 48 hours.</p>
  `);
  const result = await send({ to, subject: '🚀 You are invited to join Helios!', html });
  return { ...result, inviteLink };
};

// Reset password email
const sendResetEmail = async (to, resetToken) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'https://task-board-production-app.up.railway.app').replace(/\/$/, '');
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
  const html = baseHtml('Reset Password', `
    <h2 style="color:#1E293B;font-size:22px;font-weight:800;margin:0 0 12px;">Reset your password 🔒</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 8px;">We received a request to reset your <strong>Helios</strong> account password. Click below to choose a new one.</p>
    ${btnHtml('Reset Password', resetLink)}
    <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  `);
  const result = await send({ to, subject: '🔑 Reset your Helios password', html });
  return { ...result, resetLink };
};

// Login notification
const sendLoginAlert = async (to, userName) => {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  const html = baseHtml('Login Alert', `
    <h2 style="color:#1E293B;font-size:20px;font-weight:800;margin:0 0 12px;">New Login Detected 🔐</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0;">Hi ${userName},</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;">A new login to your Helios account was detected at <strong>${now} IST</strong>.</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;">If this wasn't you, please change your password immediately.</p>
  `);
  return send({ to, subject: '🔐 New login to your Helios account', html });
};

// Gym summary email
const sendGymSummaryEmail = async (to, dateLabel, summary = {}, items = []) => {
  const stat = (label, value, unit) => `<td style="padding:5px;"><div style="background:#FFF6F1;border:1px solid #FFE3D6;border-radius:10px;padding:10px 12px;text-align:center;"><div style="font-size:10px;font-weight:800;color:#94A3B8;text-transform:uppercase;">${label}</div><div style="font-size:18px;font-weight:800;color:#1E293B;margin-top:2px;">${value}<span style="font-size:10px;color:#94A3B8;"> ${unit||''}</span></div></div></td>`;
  const rows = items.map(it => `<tr><td style="padding:8px 10px;border-bottom:1px solid #F1F5F9;color:#475569;font-size:12px;white-space:nowrap;">${it.time||'-'}</td><td style="padding:8px 10px;border-bottom:1px solid #F1F5F9;"><span style="background:#F5F3FF;color:#7C3AED;padding:2px 7px;border-radius:999px;font-size:11px;font-weight:700;">${it.label}</span></td><td style="padding:8px 10px;border-bottom:1px solid #F1F5F9;color:#1E293B;font-size:12px;"><strong>${it.title}</strong>${it.details ? ` <span style="color:#64748B;">— ${it.details}</span>` : ''}</td></tr>`).join('');
  const html = baseHtml('Fitness Summary', `
    <h2 style="color:#1E293B;font-size:20px;font-weight:800;margin:0 0 4px;">Daily Fitness Summary 🏋</h2>
    <p style="color:#64748B;font-size:13px;margin:0 0 20px;">${dateLabel}</p>
    <table width="100%" border="0" cellspacing="0" cellpadding="0"><tr>${stat('Protein',summary.protein||0,'g')}${stat('Workout',summary.workoutDuration||0,'h')}${stat('Water',summary.water||0,'ml')}</tr><tr>${stat('Cardio',summary.cardioMinutes||0,'min')}${stat('Weight',summary.weight!=null?summary.weight:'—',summary.weight!=null?'kg':'')}${stat('Entries',items.length,'')}</tr></table>
    <p style="color:#1E293B;font-size:14px;font-weight:800;margin:20px 0 8px;">Timeline</p>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #F1F5F9;border-radius:10px;overflow:hidden;">${rows || '<tr><td style="padding:14px;color:#94A3B8;font-size:12px;">No entries.</td></tr>'}</table>
    <p style="color:#94A3B8;font-size:12px;text-align:center;margin:20px 0 0;">Keep showing up. Consistency wins. 💪</p>
  `);
  return send({ to, subject: `🏋 Fitness summary — ${dateLabel}`, html });
};

module.exports = sendEmail;
module.exports.sendInviteEmail = sendInviteEmail;
module.exports.sendResetEmail = sendResetEmail;
module.exports.sendLoginAlert = sendLoginAlert;
module.exports.sendGymSummaryEmail = sendGymSummaryEmail;
