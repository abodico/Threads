"use client"

import dynamic from "next/dynamic"
import { ReactNode } from "react"

const LeftSidebar = dynamic(() => import("@/components/shared/LeftSidebar"), {
    ssr: false,
})

interface ClientLayoutWrapperProps {
    children: ReactNode
}

const ClientLayoutWrapper = ({ children }: ClientLayoutWrapperProps) => {
    return (
        <>
            <LeftSidebar />
            <section className="main-container">
                <div className="w-full max-w-4xl">{children}</div>
            </section>
        </>
    )
}

export default ClientLayoutWrapper
