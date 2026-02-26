import nodemailer from 'nodemailer';

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || '';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || 'no-reply@surireviews.com';

  if (!host || !user || !pass) return null;

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from,
  };
}

export function isSmtpConfigured() {
  return Boolean(getSmtpConfig());
}

export async function sendSignupOtpEmail({ to, otp }) {
  const smtp = getSmtpConfig();
  if (!smtp) {
    return { sent: false, reason: 'missing_smtp' };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
  });

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: 'SuriReviews verification code',
    text: `Your SuriReviews verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your <strong>SuriReviews</strong> verification code is:</p>
           <p style="font-size:20px;font-weight:700;letter-spacing:3px">${otp}</p>
           <p>This code expires in 10 minutes.</p>`,
  });

  return { sent: true };
}

