/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidatePath } from "next/cache"
import User from "../models/user.model"
import { connectToDB } from "../mongoose"
import Thread from "../models/thread.model"

interface Params {
    username: string
    name: string
    bio: string
    image: string
    userId: string
    path: string
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
        // todo: populate community
        const threads = await User.findOne({ id: userId }).populate({
            path: "threads",
            model: Thread,
            populate: {
                path: "children",
                model: Thread,
                populate: {
                    path: "author",
                    model: User,
                    select: "name image id",
                },
            },
        })

        return threads
    } catch (error: any) {
        throw new Error("error in fetching user's posts:" + error.message)
    }
}
