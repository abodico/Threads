/* eslint-disable @typescript-eslint/no-explicit-any */
import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/mongoose"
import {
    createCommunity,
    updateCommunityInfo,
    deleteCommunity,
    addMemberToCommunity,
    removeUserFromCommunity,
} from "@/lib/actions/community.actions"

// Mark route as dynamic to prevent static generation
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.NEXT_CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
        throw new Error("Please add NEXT_CLERK_WEBHOOK_SECRET to .env")
    }

    // Get headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new NextResponse("Error: Missing svix headers", { status: 400 })
    }

    // Get body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Create new Svix instance with secret
    const wh = new Webhook(WEBHOOK_SECRET)

    let evt: WebhookEvent

    // Verify webhook
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error("Error verifying webhook:", err)
        return new NextResponse("Error: Verification error", { status: 400 })
    }

    // Handle the webhook
    const { type, data } = evt
    console.log("✅ Webhook received:", type)

    try {
        await connectToDB()

        switch (type) {
            case "organization.created": {
                const { id, name, slug, logo_url, image_url, created_by } =
                    data as any
                const community = await createCommunity(
                    id,
                    name,
                    slug,
                    logo_url || image_url,
                    "org bio",
                    created_by
                )
                return NextResponse.json({
                    message: "Community created",
                    community,
                })
            }

            case "organization.updated": {
                const { id, name, slug, image_url } = data
                const updatedCommunity = await updateCommunityInfo(
                    id,
                    name,
                    slug,
                    image_url ?? ""
                )
                return NextResponse.json({
                    message: "Community updated",
                    community: updatedCommunity,
                })
            }

            case "organization.deleted": {
                const deletedCommunity = await deleteCommunity(data?.id ?? "")
                return NextResponse.json({
                    message: "Community deleted",
                    community: deletedCommunity,
                })
            }

            case "organizationMembership.created": {
                const { organization, public_user_data } = data
                await addMemberToCommunity(
                    organization.id,
                    public_user_data.user_id
                )
                return NextResponse.json({
                    message: "Member added to community",
                })
            }

            case "organizationMembership.deleted": {
                const { organization, public_user_data } = data
                await removeUserFromCommunity(
                    public_user_data.user_id,
                    organization.id
                )
                return NextResponse.json({
                    message: "Member removed from community",
                })
            }

            case "organizationInvitation.created": {
                console.log("Invitation created:", data)
                return NextResponse.json({ message: "Invitation created" })
            }

            default:
                return NextResponse.json({ message: "Event received", type })
        }
    } catch (err) {
        console.error("❌ Error handling webhook:", err)
        return new NextResponse("Error processing webhook", { status: 500 })
    }
}
