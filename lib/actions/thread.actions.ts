/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidatePath } from "next/cache"
import Thread from "../models/thread.model"
import User from "../models/user.model"
import { connectToDB } from "../mongoose"
import Community from "../models/community.model"

interface Params {
    text: string
    author: string
    communityId: string | null
    path: string
}

interface FetchPostsParams {
    pageNumber: number
    pageSize: number
}

interface AddCommentParams {
    threadId: string
    commentText: string
    userId: string
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

export async function fetchPosts({
    pageNumber = 1,
    pageSize = 20,
}: FetchPostsParams) {
    await connectToDB()

    // calculate the number of posts to skip
    const skipAmount = (pageNumber - 1) * pageSize

    // fetch posts that have no parents
    const postsQuery = Thread.find({
        parentId: { $in: [null, undefined] },
    })
        .sort({ createdAt: "desc" })
        .skip(skipAmount)
        .limit(pageSize)
        .populate({ path: "author", model: User })
        .populate({
            path: "children",
            populate: {
                path: "author",
                model: User,
                select: "_id name parentId image",
            },
        })

    const totalPostsCount = await Thread.countDocuments({
        parentId: { $in: [null, undefined] },
    })

    const posts = await postsQuery.exec()

    const isNext = totalPostsCount > skipAmount + posts.length

    return { posts, isNext }
}

export async function fetchThreadById(id: string) {
    await connectToDB()
    try {
        // todo populate community
        const thread = await Thread.findById(id)
            .populate({
                path: "author",
                model: User,
                select: "_id id name image",
            })
            .populate({
                path: "children",
                populate: [
                    {
                        path: "author",
                        model: User,
                        select: "_id id name image parentId",
                    },
                    {
                        path: "children",
                        model: Thread,
                        populate: {
                            path: "author",
                            model: User,
                            select: "_id id name image parentId",
                        },
                    },
                ],
            })
            .exec()
        return thread
    } catch (error: any) {
        throw new Error("error fetching thread by id:" + error.message)
    }
}

export async function addCommentToThread({
    threadId,
    commentText,
    userId,
    path,
}: AddCommentParams) {
    await connectToDB()
    try {
        // find the original thread by id
        const originalThread = await Thread.findById(threadId)

        if (!originalThread) throw new Error("thread not found!")

        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId,
        })

        const savedCommentThread = await commentThread.save()

        // update the original thread to include the new comment
        originalThread.children.push(savedCommentThread._id)

        // save the original thread
        await originalThread.save()

        revalidatePath(path)
    } catch (error: any) {
        throw new Error("error in adding comment to a thread:" + error.message)
    }
}
