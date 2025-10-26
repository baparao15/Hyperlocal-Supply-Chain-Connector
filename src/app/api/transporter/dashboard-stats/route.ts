import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    try {
      const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/transporter/dashboard-stats`, {
        method: 'GET',
        headers: {
          'Authorization': token || '',
        },
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (backendError) {
      // Backend not available
      console.error('Backend error:', backendError);
      return NextResponse.json(
        { success: false, message: 'Backend server is not running. Please start the backend server.' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
