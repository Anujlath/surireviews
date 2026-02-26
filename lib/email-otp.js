import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const OTP_EXPIRY_MINUTES = 10;

function signupIdentifier(email) {
  return `signup:${String(email || '').trim().toLowerCase()}`;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueSignupOtp(email) {
  const identifier = signupIdentifier(email);
  const otp = generateOtp();
  const token = await bcrypt.hash(otp, 10);
  const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return {
    otp,
    expiresAt: expires,
  };
}

export async function verifySignupOtp(email, otp) {
  const identifier = signupIdentifier(email);
  const now = new Date();

  const tokens = await prisma.verificationToken.findMany({
    where: {
      identifier,
      expires: { gt: now },
    },
    orderBy: { expires: 'desc' },
    take: 5,
  });

  if (!tokens.length) return false;

  for (const row of tokens) {
    const ok = await bcrypt.compare(String(otp || ''), row.token);
    if (ok) {
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      return true;
    }
  }

  return false;
}

