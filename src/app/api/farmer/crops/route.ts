import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    try {
      const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/farmer/crops`, {
        method: 'GET',
        headers: {
          'Authorization': token || '',
        },
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (backendError) {
      // Backend not available - return empty array
      console.log('Backend not available, returning empty crops list');
      return NextResponse.json({
        success: true,
        data: { crops: [] }
      });
    }
  } catch (error) {
    console.error('Get crops error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch crops' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization');
    
    try {
      const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/farmer/crops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (backendError) {
      // Backend not available - return success with mock data
      console.log('Backend not available, returning demo success');
      return NextResponse.json({
        success: true,
        message: 'Crop added successfully (Demo mode - backend not running)',
        data: {
          ...body,
          _id: 'demo-' + Date.now(),
          createdAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Add crop error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add crop' },
      { status: 500 }
    );
  }
}
