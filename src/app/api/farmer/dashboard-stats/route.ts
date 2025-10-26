import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    try {
      const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/farmer/dashboard-stats`, {
        method: 'GET',
        headers: {
          'Authorization': token || '',
        },
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (backendError) {
      // Backend not available - return demo stats
      console.log('Backend not available, returning demo stats');
      return NextResponse.json({
        success: true,
        data: {
          totalCrops: 0,
          availableCrops: 0,
          totalOrders: 0,
          pendingOrders: 0,
          totalEarnings: 0,
          monthlyEarnings: 0,
          rating: 0,
          totalRatings: 0
        }
      });
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
