import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      success: true, 
      message: 'POST request received',
      data: body
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid JSON'
    }, { status: 400 });
  }
}
