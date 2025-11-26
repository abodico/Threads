// middleware.ts (in root folder)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
    "/api/webhooks/clerk(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
])

export default clerkMiddleware(async (auth, req) => {
    // Skip authentication for public routes (including webhooks)
    if (isPublicRoute(req)) {
        return
    }

    // Protect all other routes
    await auth.protect()
})

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
}
