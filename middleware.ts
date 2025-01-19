import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])
const isRootRoute = createRouteMatcher(['/'])

export default clerkMiddleware(async (auth, request) => {
    if (isPublicRoute(request)) {
        return
    }

    const { sessionClaims } = await auth()
    
    
    if (isRootRoute(request) && sessionClaims?.metadata?.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    
    await auth.protect({
        unauthenticatedUrl: new URL('/sign-in', request.url).toString()
    })
})

export const config = {
    matcher: [
        
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        
        '/(api|trpc)(.*)',
    ],
}