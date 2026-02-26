export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifySignupOtp } from '@/lib/email-otp';
import { validateSignupEmail } from '@/lib/email-validation';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, role, otp } = body;
    const normalizedRole = role === 'BUSINESS' ? 'BUSINESS' : 'USER';

    if (!email || !password || !otp) {
      return NextResponse.json(
        { error: 'Email, password and OTP are required' },
        { status: 400 }
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const validation = await validateSignupEmail(email);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const otpValid = await verifySignupOtp(validation.email, String(otp));
    if (!otpValid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validation.email,
        password: hashedPassword,
        name: name || null,
        role: normalizedRole,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
