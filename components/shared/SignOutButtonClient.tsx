"use client"

import { useClerk } from "@clerk/nextjs"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface SignOutButtonClientProps {
    component?: "LeftSidebar" | "Topbar"
}

const SignOutButtonClient: React.FC<SignOutButtonClientProps> = ({
    component,
}) => {
    const { signOut } = useClerk()
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut()
        router.push("/sign-in")
    }

    return (
        <button
            onClick={handleSignOut}
            type="button"
            className={
                "flex cursor-pointer " +
                (component === "LeftSidebar" ? "gap-4 p-4" : "")
            }
        >
            <Image
                src="/assets/logout.svg"
                alt="logout"
                width={24}
                height={24}
            />
            {component === "LeftSidebar" && (
                <p className="text-light-2 max-lg:hidden">Logout</p>
            )}
        </button>
    )
}

export default SignOutButtonClient
