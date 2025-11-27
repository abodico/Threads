"use client"

import { sidebarLinks } from "@/constants"
import { useAuth } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import SignOutButtonClient from "./SignOutButtonClient"

const Leftsidebar = () => {
    const pathname = usePathname()
    const { userId, isLoaded } = useAuth()

    return (
        <section
            className="custom-scrollbar leftsidebar"
            suppressHydrationWarning
        >
            <div
                className="flex w-full flex-1 flex-col gap-6 px-6"
                suppressHydrationWarning
            >
                {isLoaded &&
                    sidebarLinks.map((link) => {
                        const isActive =
                            (pathname.includes(link.route) &&
                                link.route.length > 1) ||
                            pathname === link.route

                        let route = link.route
                        if (link.route === "/profile" && userId) {
                            route = `/profile/${userId}`
                        }

                        return (
                            <Link
                                href={route}
                                key={link.label}
                                className={`${
                                    isActive && "bg-primary-500 "
                                } leftsidebar_link`}
                            >
                                <Image
                                    src={link.imgURL}
                                    alt={link.label}
                                    width={24}
                                    height={24}
                                />
                                <p className="text-light-1 max-lg:hidden">
                                    {link.label}
                                </p>
                            </Link>
                        )
                    })}
            </div>
            <div className="mt-10 px-6">
                {isLoaded && <SignOutButtonClient component="LeftSidebar" />}
            </div>
        </section>
    )
}

export default Leftsidebar
