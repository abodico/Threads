import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import Topbar from "@/components/shared/Topbar"
import RightSidebar from "@/components/shared/RightSidebar"
import Bottombar from "@/components/shared/Bottombar"
import ClientLayoutWrapper from "./ClientLayoutWrapper"

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
            <html lang="en" className="dark">
                <body className={`${inter.className} `}>
                    <Topbar />
                    <main className="flex flex-row">
                        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
                        <RightSidebar />
                    </main>
                    <Bottombar />
                </body>
            </html>
        </ClerkProvider>
    )
}
