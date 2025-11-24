import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ClerkProvider } from "@clerk/nextjs"

export const metadata: Metadata = {
    title: "Threads",
    description: "Next.js 16 Meta Threads Application",
}

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <ClerkProvider afterSignOutUrl={"/"}>
            <html lang="en">
                <body className={`${inter.className} bg-dark-1 dark`}>
                    <div className="w-full flex justify-center items-center min-h-screen">
                        {children}
                    </div>
                </body>
            </html>
        </ClerkProvider>
    )
}
