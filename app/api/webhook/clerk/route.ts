/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    addMemberToCommunity,
    createCommunity,
    deleteCommunity,
    removeUserFromCommunity,
    updateCommunityInfo,
} from "@/lib/actions/community.actions"
import { IncomingHttpHeaders } from "http"
import { NextResponse } from "next/server"
import { Webhook, WebhookRequiredHeaders } from "svix"

type EventType =
    | "organization.created"
    | "organizationInvitation.created"
    | "organizationMembership.created"
    | "organizationMembership.deleted"
    | "organization.updated"
    | "organization.deleted"

type Event = {
    data: Record<string, string | number | Record<string, string>[]>
    object: "event"
    type: EventType
}

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

    let evt: Event | null = null

    try {
        const wh = new Webhook(secret)
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        } as IncomingHttpHeaders & WebhookRequiredHeaders) as Event
    } catch (error) {
        console.error("❌ Clerk webhook verification failed:", error)
        return NextResponse.json({ error: "Invalid webhook" }, { status: 400 })
    }

    console.log("➡️ Webhook received:", evt.type)

    /* -------------------------------------
       ORGANIZATION CREATED
    -------------------------------------- */
    if (evt.type === "organization.created") {
        const { id, name, slug, logo_url, image_url, created_by } =
            evt?.data ?? {}

        try {
            await createCommunity(
                id.toString(),
                name.toString(),
                slug.toString(),
                logo_url.toString() || image_url.toString(),
                "org bio",
                created_by.toString()
            )

            return NextResponse.json({ status: "ok" })
        } catch (err) {
            console.log(err)
            return NextResponse.json(
                { message: "Internal Server Error" },
                { status: 500 }
            )
        }
    }

    if (evt.type === "organizationInvitation.created") {
        try {
            // Resource: https://clerk.com/docs/reference/backend-api/tag/Organization-Invitations#operation/CreateOrganizationInvitation
            console.log("Invitation created", evt?.data)

            return NextResponse.json(
                { message: "Invitation created" },
                { status: 201 }
            )
        } catch (err) {
            console.log(err)

            return NextResponse.json(
                { message: "Internal Server Error" },
                { status: 500 }
            )
        }
    }

    /* -------------------------------------
       ORGANIZATION MEMBERSHIP CREATED
    -------------------------------------- */
    if (evt.type === "organizationMembership.created") {
        try {
            const { organization, public_user_data } = evt?.data as any
            console.log(organization)

            await addMemberToCommunity(
                organization?.id,
                public_user_data.user_id
            )

            return NextResponse.json({ status: "ok" })
        } catch (err) {
            console.log(err)

            return NextResponse.json(
                { message: "Internal Server Error" },
                { status: 500 }
            )
        }
    }

    /* -------------------------------------
       MEMBERSHIP DELETED
    -------------------------------------- */
    if (evt.type === "organizationMembership.deleted") {
        const { organization, public_user_data } = evt.data as any

        await removeUserFromCommunity(public_user_data.user_id, organization.id)

        return NextResponse.json({ status: "ok" })
    }

    /* -------------------------------------
       ORGANIZATION UPDATED
    -------------------------------------- */
    if (evt.type === "organization.updated") {
        try {
            const { id, name, slug, image_url } = evt.data

            await updateCommunityInfo(
                id as string,
                name as string,
                slug as string,
                image_url as string
            )

            return NextResponse.json({ status: "ok" })
        } catch (err) {
            console.log(err)

            return NextResponse.json(
                { message: "Internal Server Error" },
                { status: 500 }
            )
        }
    }

    /* -------------------------------------
       ORGANIZATION DELETED
    -------------------------------------- */
    if (evt.type === "organization.deleted") {
        try {
            await deleteCommunity(evt?.data?.id as any)

            return NextResponse.json({ status: "ok" })
        } catch (err) {
            console.log(err)

            return NextResponse.json(
                { message: "Internal Server Error" },
                { status: 500 }
            )
        }
    }

    return NextResponse.json({ message: "Ignored event" })
}
