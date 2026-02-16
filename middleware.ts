export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*', '/messenger/:path*'],
};

export default function middleware(request: Request) {
    const url = new URL(request.url);

    // 1. Check for auth_token cookie
    // We do a simple string check here for performance. 
    // Robust validation happens in the client-side loader/SDK or via a separate verification call if needed.
    const cookieHeader = request.headers.get('cookie') || '';
    const hasToken = cookieHeader.includes('auth_token=');

    if (!hasToken) {
        // 2. Redirect to Login if missing
        // Use 307 Temporary Redirect to preserve method/body if mostly GET
        return Response.redirect(new URL('/login', url.origin), 307);
    }

    // 3. Allow request to proceed
    // Vercel Middleware falls through if no response is returned? 
    // Actually, standard Pattern is to return `next()` or nothing.
    // In Vercel Edge Middleware (Standard Web API), returning nothing = continue?
    // Or we might need `next()`.

    // Wait, looking at Vercel docs:
    // "If you don't return a response, the request will continue to the origin."
}
