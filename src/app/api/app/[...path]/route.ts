import { NextResponse } from 'next/server';

const MU_API_KEY = process.env.MU_API_KEY || 'YOUR_MU_API_KEY';

async function handleProxy(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const method = req.method;
    const body = method !== 'GET' && method !== 'HEAD' ? await req.text() : undefined;
    const resolvedParams = await params;
    const pathParams = resolvedParams.path.join('/');
    
    const urlObj = new URL(req.url);
    const queryString = urlObj.search;
    
    // Construct the target URL for 'app' routes
    const targetUrl = `https://api.muapi.ai/app/${pathParams}${queryString}`;
    
    const headers: Record<string, string> = {
        'x-api-key': MU_API_KEY,
    };
    
    if (body) {
        headers['Content-Type'] = req.headers.get('content-type') || 'application/json';
    }

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ detail: errorText || "Unknown error from remote server" }, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return NextResponse.json(data);
    } else {
        const textData = await response.text();
        return new NextResponse(textData, {
            status: 200,
            headers: { 'Content-Type': contentType || 'text/plain' }
        });
    }

  } catch (error: any) {
    console.error("App Proxy Error:", error);
    return NextResponse.json(
      { detail: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const DELETE = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
