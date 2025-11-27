"use client"

import Image from "next/image"
import Link from "next/link"
import OrganizationSwitcherClient from "./OrganizationSwitcherClient"
import dynamic from "next/dynamic"

// Dynamically import to prevent hydration issues
const SignOutButtonClient = dynamic(
    () => import("@/components/shared/SignOutButtonClient"),
    { ssr: false }
)

const Topbar = () => {
    return (
        <nav className="topbar">
            <Link href="/" className="flex items-center gap-4">
                <Image
                    src="/assets/logo.svg"
                    alt="logo"
                    width={28}
                    height={28}
                />
                <p className="text-heading3-bold text-light-1 max-xs:hidden">
                    Threads
                </p>
            </Link>
            <div className="flex items-center gap-1">
                <div className="block md:hidden">
                    <SignOutButtonClient component="Topbar" />
                </div>
                <OrganizationSwitcherClient />
            </div>
        </nav>
    )
}

export default Topbar
