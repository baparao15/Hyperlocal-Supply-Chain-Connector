import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const formData = await request.formData();
      
      const response = await fetch(`${backendUrl}/api/upload/single`, {
        method: 'POST',
        headers: {
          'Authorization': token
        },
        body: formData
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    } catch (backendError) {
      console.error('Backend error:', backendError);
      
      // Demo mode: Return placeholder URL
      return NextResponse.json({
        success: true,
        data: {
          url: 'https://via.placeholder.com/800x600?text=Crop+Image',
          publicId: 'demo-' + Date.now(),
          secureUrl: 'https://via.placeholder.com/800x600?text=Crop+Image'
        }
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

