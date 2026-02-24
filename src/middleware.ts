import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect /console/* routes
    if (pathname.startsWith("/console")) {
        const cookie = request.cookies.get("onboarding_session")?.value;
        if (!cookie) {
            return NextResponse.redirect(new URL("/onboard/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/console/:path*"],
};
