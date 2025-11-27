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
    try {
        await connectToDB()
        return User.findOne({ id: userId })
        //     .populate({
        //     path: "communities",
        //     model: Community,
        // })
    } catch (error: any) {
        throw new Error("failed to fetch user:" + error.message)
    }
}

export async function fetchUserPosts(userId: string) {
    await connectToDB()
    try {
        const threads = await User.findOne({ id: userId }).populate({
            path: "threads",
            model: Thread,
            populate: [
                {
                    path: "children",
                    model: Thread,
                    populate: {
                        path: "author",
                        model: User,
                        select: "name image id",
                    },
                },
                {
                    path: "community",
                    model: Community,
                },
            ],
        })

        return threads
    } catch (error: any) {
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
