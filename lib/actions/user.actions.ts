/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidatePath } from "next/cache"
import User from "../models/user.model"
import { connectToDB } from "../mongoose"
import Thread from "../models/thread.model"
import { FilterQuery, SortOrder } from "mongoose"
import Community from "../models/community.model"

interface Params {
    username: string
    name: string
    bio: string
    image: string
    userId: string
    path: string
}

interface FetchUsersParams {
    userId: string
    searchString?: string
    pageNumber?: number
    pageSize?: number
    sortBy?: SortOrder
}
export async function updateUser({
    username,
    name,
    bio,
    image,
    userId,
    path,
}: Params): Promise<void> {
    await connectToDB()
    try {
        console.log("from the update user method", image[1])
        await User.findOneAndUpdate(
            { id: userId },
            {
                username: username.toLowerCase(),
                name,
                bio,
                image,
                path,
                onboarded: true,
            },
            { upsert: true } // this means updating & inserting so it updates if the value exists and insert it if not ...
        )

        if (path === "/profile/edit") {
            revalidatePath(path) // allows you to revalidate data associated with a specific path
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.log(error)
        throw new Error(`failed to create/update user: ` + error.message)
    }
}

export async function fetchUser(userId: string) {
    await connectToDB()
    try {
        const user = await User.findOne({ id: userId })
            .select(
                "_id id name username image bio onboarded threads communities"
            )
            .lean()
            .exec()

        if (!user) return null

        // Clean and serialize
        const cleanUser = JSON.parse(JSON.stringify(user))

        return {
            _id: String(cleanUser._id || ""),
            id: cleanUser.id || "",
            name: cleanUser.name || "",
            username: cleanUser.username || "",
            image: cleanUser.image || "",
            bio: cleanUser.bio || "",
            onboarded: cleanUser.onboarded || false,
            threads: Array.isArray(cleanUser.threads)
                ? cleanUser.threads.map((t: any) => String(t))
                : [],
            communities: Array.isArray(cleanUser.communities)
                ? cleanUser.communities.map((c: any) => String(c))
                : [],
        }
    } catch (error: any) {
        console.error("Error fetching user:", error.message)
        throw new Error("Failed to fetch user: " + error.message)
    }
}

export async function fetchUserPosts(userId: string) {
    await connectToDB()
    try {
        const user = await User.findOne({ _id: userId })
            .select("_id id name image threads") // Only select what you need
            .populate({
                path: "threads",
                model: Thread,
                select: "text parentId createdAt author community children likes",
                populate: [
                    {
                        path: "children",
                        model: Thread,
                        select: "text parentId createdAt author likes",
                        populate: {
                            path: "author",
                            model: User,
                            select: "name image id _id",
                        },
                    },
                    {
                        path: "community",
                        model: Community,
                        select: "_id id name image",
                    },
                ],
            })
            .lean()
            .exec()

        if (!user) return null

        // Break circular references
        const cleanData = JSON.parse(JSON.stringify(user))

        const threads = Array.isArray(cleanData.threads)
            ? cleanData.threads
            : []

        return {
            _id: String(cleanData._id || ""),
            id: cleanData.id || "",
            name: cleanData.name || "",
            image: cleanData.image || "",
            threads: threads.map((thread: any) => ({
                _id: String(thread._id || ""),
                text: thread.text || "",
                parentId: thread.parentId ? String(thread.parentId) : null,
                createdAt: thread.createdAt || new Date().toISOString(),
                author: {
                    _id: String(cleanData._id || ""),
                    id: cleanData.id || "",
                    name: cleanData.name || "",
                    image: cleanData.image || "",
                },
                community: thread.community
                    ? {
                          _id: String(thread.community._id || ""),
                          id: thread.community.id || "",
                          name: thread.community.name || "",
                          image: thread.community.image || "",
                      }
                    : null,
                children: Array.isArray(thread.children)
                    ? thread.children.map((child: any) => ({
                          _id: String(child._id || ""),
                          text: child.text || "",
                          parentId: child.parentId
                              ? String(child.parentId)
                              : null,
                          createdAt:
                              child.createdAt || new Date().toISOString(),
                          author: child.author
                              ? {
                                    _id: String(child.author._id || ""),
                                    id: child.author.id || "",
                                    name: child.author.name || "",
                                    image: child.author.image || "",
                                }
                              : null,
                      }))
                    : [],
                likeCount: Array.isArray(thread.likes)
                    ? thread.likes.length
                    : 0,
                isLikedByCurrentUser: thread?.likes?.includes(String(userId)),
                likes: thread.likes,
            })),
        }
    } catch (error: any) {
        console.error("Error in fetching user's posts:", error.message)
        throw new Error("error in fetching user's posts:" + error.message)
    }
}
export async function fetchUsers({
    userId,
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = "desc",
}: FetchUsersParams) {
    try {
        await connectToDB()

        const skipAmount = (pageNumber - 1) * pageSize

        const regex = new RegExp(searchString, "i")

        const query: FilterQuery<typeof User> = {
            id: { $ne: userId },
        }

        if (searchString.trim() !== "") {
            query.$or = [
                { username: { $regex: regex } },
                { name: { $regex: regex } },
            ]
        }

        const sortOptions = { createdAt: sortBy }

        const usersQuery = User.find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize)

        const totalUsersCount = await User.countDocuments(query)

        const users = await usersQuery.exec()

        const isNext = totalUsersCount > skipAmount + users.length

        return { users, isNext }
    } catch (error: any) {
        throw new Error("error in fetching all users:" + error.message)
    }
}

export async function getActivity(userId: string) {
    try {
        await connectToDB()
        // find all threads created by the user
        const userThreads = await Thread.find({ author: userId })

        // collect all the child thread ids (replies) from the 'children' array
        const childThreadIds = userThreads.reduce((acc, userThread) => {
            return acc.concat(userThread.children)
        }, [])
        const replies = await Thread.find({
            _id: { $in: childThreadIds },
            author: { $ne: userId },
        }).populate({ path: "author", model: User, select: "name image _id" })

        return replies
    } catch (error: any) {
        throw new Error(
            "error in getting activities (notifications):" + error.message
        )
    }
}
