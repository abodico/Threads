"use client"

import { OrganizationSwitcher } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useState, useEffect } from "react"

const OrganizationSwitcherClient = () => {
    const [mounted, setMounted] = useState(false)

    // This effect will only run after the first render
    useEffect(() => {
        // wrap in a microtask to avoid sync update warnings
        const id = requestAnimationFrame(() => setMounted(true))
        return () => cancelAnimationFrame(id)
    }, [])

    if (!mounted) return null

    return (
        <OrganizationSwitcher
            appearance={{
                baseTheme: dark,
                elements: { organizationSwitcherTrigger: "py-2 px-4" },
            }}
        />
    )
}

export default OrganizationSwitcherClient
