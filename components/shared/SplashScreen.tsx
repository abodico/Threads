"use client"

import Image from "next/image"
import React, { useEffect, useState } from "react"

const SplashScreen = () => {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Simulate loading progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval)
                    return 90
                }
                return prev + Math.floor(Math.random() * 10) + 1
            })
        }, 150)

        return () => clearInterval(interval)
    }, [])

    return (
        <div
            id="splash-screen"
            className="fixed inset-0 z-9999 flex items-center justify-center bg-linear-to-br from-indigo-900 via-purple-900 to-pink-800 transition-opacity duration-500"
            suppressHydrationWarning
        >
            <div className="text-center p-8 max-w-md mx-4">
                {/* Logo/Brand */}
                <div className="mb-8 animate-bounce">
                    <div className="w-24 h-24 mx-auto rounded-full bg-linear-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl">
                        <Image
                            src={"/assets/logo.svg"}
                            alt="logo"
                            width={96}
                            height={96}
                        />
                    </div>
                    <h1 className="mt-4 text-3xl font-bold text-white">
                        Threads
                    </h1>
                </div>

                {/* Animated Dots */}
                <div className="flex justify-center space-x-2 mb-6">
                    {[1, 2, 3].map((dot) => (
                        <div
                            key={dot}
                            className="w-3 h-3 bg-white rounded-full animate-pulse"
                            style={{ animationDelay: `${dot * 0.2}s` }}
                        ></div>
                    ))}
                </div>

                {/* Loading Text */}
                <p className="text-white/90 text-lg mb-6 animate-pulse">
                    Loading your experience...
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-white/80 text-sm mb-2">
                        <span>Loading...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-linear-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Subtle Message */}
                <p className="text-white/60 text-sm mt-8">
                    Please wait while we prepare everything
                </p>
            </div>
        </div>
    )
}

export default SplashScreen
