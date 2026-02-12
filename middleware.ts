import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Define public paths
    const isPublicPath =
        pathname === "/unlock" ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname.includes(".") || // static files
        pathname === "/favicon.ico";

    if (isPublicPath) {
        return NextResponse.next();
    }

    // 2. Check for session cookie
    const session = request.cookies.get("mymoney_session")?.value;

    if (!session) {
        // If it's an API request, return 401
        if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Otherwise redirect to unlock page
        const url = request.nextUrl.clone();
        url.pathname = "/unlock";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
