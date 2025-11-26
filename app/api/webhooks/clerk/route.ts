/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/webhooks/clerk/route.ts
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
    console.log("✅ Webhook received:", type, "Data:", JSON.stringify(data))

    try {
        await connectToDB()

        switch (type) {
            /* -------------------------------------
               ORGANIZATION EVENTS
            -------------------------------------- */
            case "organization.created": {
                const { id, name, slug, logo_url, image_url, created_by } =
                    data as any
                console.log("Creating community:", { id, name, slug })

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
                const { id, name, slug, image_url } = data as any
                console.log("Updating community:", { id, name, slug })

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
                const { id } = data as any
                console.log("Deleting community:", id)

                const deletedCommunity = await deleteCommunity(id)
                return NextResponse.json({
                    message: "Community deleted",
                    community: deletedCommunity,
                })
            }

            /* -------------------------------------
               ORGANIZATION MEMBERSHIP EVENTS
            -------------------------------------- */
            case "organizationMembership.created": {
                const { organization, public_user_data } = data as any
                console.log("Adding member:", {
                    orgId: organization.id,
                    userId: public_user_data.user_id,
                })

                await addMemberToCommunity(
                    organization.id,
                    public_user_data.user_id
                )
                return NextResponse.json({
                    message: "Member added to community",
                })
            }

            case "organizationMembership.updated": {
                const { organization, public_user_data } = data as any
                console.log("Membership updated:", {
                    orgId: organization.id,
                    userId: public_user_data.user_id,
                })

                // Handle role changes or other membership updates
                // You might want to add a function to update member role
                return NextResponse.json({
                    message: "Membership updated",
                })
            }

            case "organizationMembership.deleted": {
                const { organization, public_user_data } = data as any
                console.log("Removing member:", {
                    orgId: organization.id,
                    userId: public_user_data.user_id,
                })

                await removeUserFromCommunity(
                    public_user_data.user_id,
                    organization.id
                )
                return NextResponse.json({
                    message: "Member removed from community",
                })
            }

            /* -------------------------------------
               ORGANIZATION INVITATION EVENTS
            -------------------------------------- */
            case "organizationInvitation.created": {
                const { id, email_address, organization_id } = data as any
                console.log("Invitation created:", {
                    invitationId: id,
                    email: email_address,
                    orgId: organization_id,
                })

                // You can store invitation data if needed
                return NextResponse.json({ message: "Invitation created" })
            }

            case "organizationInvitation.accepted": {
                const { id, organization_id, public_user_data } = data as any
                console.log("Invitation accepted:", {
                    invitationId: id,
                    orgId: organization_id,
                    userId: public_user_data?.user_id,
                })

                // Note: organizationMembership.created will also fire
                // So the member will be added automatically
                return NextResponse.json({ message: "Invitation accepted" })
            }

            case "organizationInvitation.revoked": {
                const { id, email_address, organization_id } = data as any
                console.log("Invitation revoked:", {
                    invitationId: id,
                    email: email_address,
                    orgId: organization_id,
                })

                // Handle invitation revocation if you're storing them
                return NextResponse.json({ message: "Invitation revoked" })
            }

            default:
                console.log("Unhandled event type:", type)
                return NextResponse.json({
                    message: "Event received but not handled",
                    type,
                })
        }
    } catch (err) {
        console.error("❌ Error handling webhook:", err)
        return new NextResponse("Error processing webhook", { status: 500 })
    }
}
