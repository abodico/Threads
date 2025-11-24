import { NextResponse } from "next/server"
import { Webhook } from "svix"

import {
    createCommunity,
    addMemberToCommunity,
    removeUserFromCommunity,
    updateCommunityInfo,
    deleteCommunity,
} from "@/lib/actions/community.actions"

export async function POST(req: Request) {
    const payload = await req.text()

    const secret = process.env.NEXT_CLERK_WEBHOOK_SECRET
    if (!secret) {
        return NextResponse.json(
            { error: "Missing NEXT_CLERK_WEBHOOK_SECRET" },
            { status: 500 }
        )
    }

    // Svix headers required for verification
    const svix_id = req.headers.get("svix-id")
    const svix_timestamp = req.headers.get("svix-timestamp")
    const svix_signature = req.headers.get("svix-signature")

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json(
            { error: "Missing svix headers" },
            { status: 400 }
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let evt: any

    try {
        const wh = new Webhook(secret)
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        })
    } catch (error) {
        console.error("❌ Clerk webhook verification failed:", error)
        return NextResponse.json({ error: "Invalid webhook" }, { status: 400 })
    }

    console.log("➡️ Webhook received:", evt.type)

    /* -------------------------------------
       ORGANIZATION CREATED
    -------------------------------------- */
    if (evt.type === "organization.created") {
        const { id, name, slug, image_url, created_by } = evt.data

        await createCommunity(id, name, slug, image_url, "org bio", created_by)

        return NextResponse.json({ status: "ok" })
    }

    /* -------------------------------------
       ORGANIZATION MEMBERSHIP CREATED
    -------------------------------------- */
    if (evt.type === "organizationMembership.created") {
        const { organization, public_user_data } = evt.data

        await addMemberToCommunity(organization.id, public_user_data.user_id)

        return NextResponse.json({ status: "ok" })
    }

    /* -------------------------------------
       MEMBERSHIP DELETED
    -------------------------------------- */
    if (evt.type === "organizationMembership.deleted") {
        const { organization, public_user_data } = evt.data

        await removeUserFromCommunity(public_user_data.user_id, organization.id)

        return NextResponse.json({ status: "ok" })
    }

    /* -------------------------------------
       ORGANIZATION UPDATED
    -------------------------------------- */
    if (evt.type === "organization.updated") {
        const { id, name, slug, image_url } = evt.data

        await updateCommunityInfo(id, name, slug, image_url)

        return NextResponse.json({ status: "ok" })
    }

    /* -------------------------------------
       ORGANIZATION DELETED
    -------------------------------------- */
    if (evt.type === "organization.deleted") {
        await deleteCommunity(evt.data.id)

        return NextResponse.json({ status: "ok" })
    }

    return NextResponse.json({ message: "Ignored event" })
}
