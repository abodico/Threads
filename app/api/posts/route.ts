/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { fetchPosts } from "@/lib/actions/thread.actions"
import { fetchUser } from "@/lib/actions/user.actions"

export async function GET() {
    const user = await currentUser()
    const dbUser = await fetchUser(user?.id ?? "")

    const result = await fetchPosts({
        pageNumber: 1,
        pageSize: 30,
        sessionUserId: dbUser?._id ?? "",
    })

    const safePosts = result.posts.map((post: any) => ({
        ...post,
        _id: String(post._id),
        parentId: post.parentId ? String(post.parentId) : null,
        createdAt:
            typeof post.createdAt === "string"
                ? post.createdAt
                : new Date(post.createdAt).toISOString(),
        author: post.author
            ? { ...post.author, _id: String(post.author._id) }
            : null,
        community: post.community
            ? { ...post.community, _id: String(post.community._id) }
            : null,
        children:
            post.children?.map((child: any) => ({
                ...child,
                _id: String(child._id),
                createdAt:
                    typeof child.createdAt === "string"
                        ? child.createdAt
                        : new Date(child.createdAt).toISOString(),
            })) || [],
    }))

    return NextResponse.json({
        posts: safePosts,
        dbUserId: String(dbUser?._id ?? ""),
        clerkUserId: user?.id ?? "",
    })
}
