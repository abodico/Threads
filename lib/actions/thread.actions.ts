/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidatePath } from "next/cache"

import { connectToDB } from "../mongoose"

import User from "../models/user.model"
import Thread from "../models/thread.model"
import Community from "../models/community.model"

interface FetchPostsParams {
    pageNumber?: number
    pageSize?: number
    sessionUserId: string
}
export async function fetchPosts({
    pageNumber = 1,
    pageSize = 20,
    sessionUserId,
}: FetchPostsParams) {
    await connectToDB()

    const skipAmount = (pageNumber - 1) * pageSize

    const posts = await Thread.find({ parentId: null })
        .sort({ createdAt: "desc" })
        .skip(skipAmount)
        .limit(pageSize)
        .populate({
            path: "author",
            model: User,
            select: "_id id name image",
        })
        .populate({
            path: "community",
            model: Community,
            select: "_id name image",
        })
        .populate({
            path: "children",
            populate: {
                path: "author",
                model: User,
                select: "_id name image",
            },
        })
        .lean({ virtuals: true })

    const totalPostsCount = await Thread.countDocuments({ parentId: null })

    const transformedPosts = posts.map((post: any) => {
        // Convert likes → strings
        const likes = (post.likes || []).map((l: any) => l.toString())

        return {
            ...post,

            _id: String(post._id),
            parentId: post.parentId ? String(post.parentId) : null,

            author: post.author
                ? {
                      ...post.author,
                      _id: String(post.author._id),
                  }
                : null,

            community: post.community
                ? {
                      ...post.community,
                      _id: String(post.community._id),
                  }
                : null,

            children: post.children?.map((child: any) => ({
                ...child,
                _id: String(child._id),
                parentId: child.parentId ? String(child.parentId) : null,
                author: child.author
                    ? {
                          ...child.author,
                          _id: String(child.author._id),
                      }
                    : null,
            })),

            likeCount: likes.length,
            isLikedByCurrentUser: likes.includes(String(sessionUserId)),
        }
    })

    const isNext = totalPostsCount > skipAmount + posts.length

    return { posts: transformedPosts, isNext }
}

interface Params {
    text: string
    author: string
    communityId: string | null
    path: string
}

export async function createThread({
    text,
    author,
    communityId,
    path,
}: Params) {
    try {
        connectToDB()

        const communityIdObject = await Community.findOne(
            { id: communityId },
            { _id: 1 }
        )

        const createdThread = await Thread.create({
            text,
            author,
            community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
        })

        // Update User model
        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id },
        })

        if (communityIdObject) {
            // Update Community model
            await Community.findByIdAndUpdate(communityIdObject, {
                $push: { threads: createdThread._id },
            })
        }

        revalidatePath(path)
    } catch (error: any) {
        throw new Error(`Failed to create thread: ${error.message}`)
    }
}

export async function fetchAllChildThreads(threadId: string) {
    await connectToDB()

    // Fetch ALL descendants in one query
    const allThreads = await Thread.find({
        $or: [{ _id: threadId }, { parentId: threadId }],
    })
        .populate({
            path: "author",
            model: User,
        })
        .populate({
            path: "community",
            model: Community,
        })
        .lean()

    // Build a map of threadId → children
    const map: Record<string, any[]> = {}

    allThreads.forEach((thread) => {
        map[thread.parentId] = map[thread.parentId] || []
        map[thread.parentId].push(thread)
    })

    // Recursively build the tree structure
    function buildTree(id: string) {
        const node = map[id] || []
        return node.map((child) => ({
            ...child.toObject(),
            children: buildTree(child._id.toString()),
        }))
    }

    return buildTree(threadId)
}

export async function deleteThread(id: string, path: string): Promise<void> {
    try {
        connectToDB()

        // Find the thread to be deleted (the main thread)
        const mainThread = await Thread.findById(id).populate(
            "author community"
        )

        if (!mainThread) {
            throw new Error("Thread not found")
        }

        // Fetch all child threads and their descendants recursively
        const descendantThreads = await fetchAllChildThreads(id)

        // Get all descendant thread IDs including the main thread ID and child thread IDs
        const descendantThreadIds = [
            id,
            ...descendantThreads.map((thread) => thread._id),
        ]

        // Extract the authorIds and communityIds to update User and Community models respectively
        const uniqueAuthorIds = new Set(
            [
                ...descendantThreads.map((thread) =>
                    thread.author?._id?.toString()
                ), // Use optional chaining to handle possible undefined values
                mainThread.author?._id?.toString(),
            ].filter((id) => id !== undefined)
        )

        const uniqueCommunityIds = new Set(
            [
                ...descendantThreads.map((thread) =>
                    thread.community?._id?.toString()
                ), // Use optional chaining to handle possible undefined values
                mainThread.community?._id?.toString(),
            ].filter((id) => id !== undefined)
        )

        // Recursively delete child threads and their descendants
        await Thread.deleteMany({ _id: { $in: descendantThreadIds } })

        // Update User model
        await User.updateMany(
            { _id: { $in: Array.from(uniqueAuthorIds) } },
            { $pull: { threads: { $in: descendantThreadIds } } }
        )

        // Update Community model
        await Community.updateMany(
            { _id: { $in: Array.from(uniqueCommunityIds) } },
            { $pull: { threads: { $in: descendantThreadIds } } }
        )

        revalidatePath(path)
    } catch (error: any) {
        throw new Error(`Failed to delete thread: ${error.message}`)
    }
}

export async function fetchThreadById(threadId: string) {
    await connectToDB()

    // Fetch the main thread
    const rootThread = await Thread.findById(threadId)
        .populate({
            path: "author",
            model: User,
            select: "_id id name image",
        })
        .populate({
            path: "community",
            model: Community,
            select: "_id id name image",
        })
        .lean()

    if (!rootThread) return null

    // Fetch ALL descendants in one query
    const descendants = await Thread.find({
        $or: [{ parentId: threadId }, { _id: { $ne: threadId } }],
    })
        .populate({
            path: "author",
            model: User,
            select: "_id id name image",
        })
        .populate({
            path: "community",
            model: Community,
            select: "_id id name image",
        })
        .lean()

    // Build a map of parentId → children
    const map: Record<string, any[]> = {}
    descendants.forEach((t) => {
        const parentId = t.parentId?.toString() || ""
        map[parentId] = map[parentId] || []
        map[parentId].push(t)
    })

    // Recursive builder with ObjectId conversion
    function buildTree(thread: any) {
        const children = map[thread._id.toString()] || []

        // Convert all ObjectId fields to strings
        const convertedThread = {
            ...thread,
            _id: thread._id.toString(),
            parentId: thread.parentId?.toString() || null,
            author: {
                ...thread.author,
                _id:
                    thread.author?._id?.toString() ||
                    thread.author?._id ||
                    null,
            },
            community: thread.community
                ? {
                      ...thread.community,
                      _id:
                          thread.community._id?.toString() ||
                          thread.community._id ||
                          null,
                  }
                : null,
        }

        return {
            ...convertedThread,
            children: children.map(buildTree),
        }
    }

    return buildTree(rootThread)
}

interface AddCommentProps {
    threadId: string
    commentText: string
    userId: string
    path: string
}

export async function addCommentToThread({
    threadId,
    commentText,
    userId,
    path,
}: AddCommentProps) {
    connectToDB()

    try {
        // Find the original thread by its ID
        const originalThread = await Thread.findById(threadId)

        if (!originalThread) {
            throw new Error("Thread not found")
        }

        // Create the new comment thread
        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId, // Set the parentId to the original thread's ID
        })

        // Save the comment thread to the database
        const savedCommentThread = await commentThread.save()

        // Add the comment thread's ID to the original thread's children array
        originalThread.children.push(savedCommentThread._id)

        // Save the updated original thread to the database
        await originalThread.save()

        revalidatePath(path)
    } catch (err) {
        console.error("Error while adding comment:", err)
        throw new Error("Unable to add comment")
    }
}

interface LikeProps {
    threadId: string
    userId: string
}
export async function toggleLikeThread({ threadId, userId }: LikeProps) {
    await connectToDB()

    try {
        // Validate ID
        if (!threadId || !userId) {
            throw new Error("Missing threadId or userId")
        }

        const thread = await Thread.findById(threadId)

        if (!thread) {
            throw new Error("Thread not found")
        }

        // Convert ObjectIds to strings for comparison
        const likes = thread.likes.map((id) => id.toString())

        const hasLiked = likes.includes(userId)

        if (hasLiked) {
            thread.likes.pull(userId)
        } else {
            thread.likes.addToSet(userId)
        }

        await thread.save()

        return {
            liked: !hasLiked,
            likeCount: thread.likes.length,
        }
    } catch (err) {
        console.error("Error while liking thread:", err)
        throw new Error("Unable to like thread")
    }
}
