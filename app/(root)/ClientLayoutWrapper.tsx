"use client"

import SplashScreen from "@/components/shared/SplashScreen"
import { useAuth } from "@clerk/nextjs"
import dynamic from "next/dynamic"
import { ReactNode, useEffect, useState } from "react"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
const LeftSidebar = dynamic(() => import("@/components/shared/LeftSidebar"), {
    ssr: false,
})

interface ClientLayoutWrapperProps {
    children: ReactNode
}

const ClientLayoutWrapper = ({ children }: ClientLayoutWrapperProps) => {
    const [loading, setLoading] = useState(true)
    const { isLoaded } = useAuth()
    // Create a client
    const queryClient = new QueryClient()

    useEffect(() => {
        // Handle the splash screen visibility
        const handleLoad = () => {
            // Update progress to 100%
            const progressBar = document.querySelector(
                "#splash-screen .h-full"
            ) as HTMLElement
            if (progressBar) {
                progressBar.style.width = "100%"
            }

            // Hide splash screen after delay
            setTimeout(() => {
                setLoading(false)

                // Remove from DOM after animation
                setTimeout(() => {
                    const splash = document.getElementById("splash-screen")
                    if (splash && splash.parentNode) {
                        splash.parentNode.removeChild(splash)
                    }
                }, 500)
            }, 800)
        }

        if (isLoaded) {
            // If page is already loaded
            if (document.readyState === "complete") {
                setTimeout(handleLoad, 1000)
            } else {
                window.addEventListener("load", handleLoad)
                return () => window.removeEventListener("load", handleLoad)
            }

            // Fallback timeout (max 5 seconds)
            const timeoutId = setTimeout(() => {
                setLoading(false)
            }, 5000)

            return () => clearTimeout(timeoutId)
        }
    }, [isLoaded])
    return (
        <>
            {loading && <SplashScreen />}
            <QueryClientProvider client={queryClient}>
                <LeftSidebar />
                <section
                    className={
                        "main-container " +
                        (loading ? "opacity-0" : "opacity-100")
                    }
                >
                    <div className="w-full max-w-4xl">{children}</div>
                </section>
            </QueryClientProvider>
        </>
    )
}

export default ClientLayoutWrapper
