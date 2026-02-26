export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSignupEmail } from '@/lib/email-validation';
import { issueSignupOtp } from '@/lib/email-otp';
import { isSmtpConfigured, sendSignupOtpEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = await validateSignupEmail(body?.email);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: validation.email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const { otp } = await issueSignupOtp(validation.email);
    let mailResult = { sent: false };
    let mailError = null;
    try {
      mailResult = await sendSignupOtpEmail({ to: validation.email, otp });
    } catch (error) {
      mailError = error;
    }

    if (!mailResult.sent || mailError) {
      if (process.env.NODE_ENV !== 'production') {
        const message = !isSmtpConfigured()
          ? 'OTP generated. Configure SMTP for email delivery.'
          : 'OTP generated, but SMTP delivery failed. Check SMTP credentials.';
        return NextResponse.json({
          message,
          otpDevOnly: otp,
        });
      }

      if (mailError) {
        const raw = String(mailError?.message || '');
        const smtpError = /auth|535|invalid login/i.test(raw)
          ? 'SMTP authentication failed. Verify SMTP username/password.'
          : 'Could not send OTP email. Please verify SMTP settings.';
        return NextResponse.json({ error: smtpError }, { status: 502 });
      }

      return NextResponse.json(
        { error: 'Could not send OTP email. Please configure SMTP settings.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'OTP sent to your email address' });
  } catch (error) {
    console.error('Request OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
