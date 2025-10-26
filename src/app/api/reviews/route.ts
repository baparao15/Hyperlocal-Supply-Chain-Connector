import { NextRequest, NextResponse } from 'next/server';
import { jsonwebtoken } from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, ratedUserId, ratedUserType, rating, comment } = body;
    
    // Validation
    if (!orderId || !ratedUserId || !ratedUserType || !rating) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const token = request.headers.get('authorization');
      
      const response = await fetch(`${backendUrl}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({ orderId, ratedUserId, ratedUserType, rating, comment })
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    } catch (backendError) {
      console.error('Backend error:', backendError);
      return NextResponse.json(
        { success: false, message: 'Backend server is not running' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create review' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const token = request.headers.get('authorization');
      
      const response = await fetch(`${backendUrl}/api/reviews/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': token || ''
        }
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    } catch (backendError) {
      console.error('Backend error:', backendError);
      return NextResponse.json(
        { success: false, message: 'Backend server is not running' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get reviews' },
      { status: 500 }
    );
  }
}

