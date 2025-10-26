import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userType, phone, name, location, bankDetails, language } = body;

    if (!email || !userType) {
      return NextResponse.json(
        { success: false, message: 'Email and user type are required' },
        { status: 400 }
      );
    }

    // Try to call backend API to send OTP via email
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userType,
          phone,
          name,
          location,
          bankDetails,
          language
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return NextResponse.json(result, { status: response.status });
      }

      console.log(`OTP sent to ${email}`);
      return NextResponse.json(result);
    } catch (backendError) {
      console.error('Backend connection error:', backendError);
      return NextResponse.json({
        success: false,
        message: 'Backend service is not available. Please try again later.'
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
