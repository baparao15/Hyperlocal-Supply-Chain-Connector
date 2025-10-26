import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;
    
    console.log('Verify OTP Request:', { email, otp });

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Try to call backend API to verify OTP
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        return NextResponse.json(result, { status: response.status });
      }

      // Map backend response to frontend format
      return NextResponse.json({
        success: true,
        message: result.message || 'OTP verified successfully',
        token: result.token,
        user: result.user
      });
    } catch (backendError) {
      console.error('Backend connection error:', backendError);
      return NextResponse.json({
        success: false,
        message: 'Backend service is not available. Please try again later.'
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP. Please try again.' },
      { status: 500 }
    );
  }
}
