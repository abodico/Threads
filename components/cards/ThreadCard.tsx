/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { formatDateString } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { toggleLikeThread } from "@/lib/actions/thread.actions"

interface Props {
    id: string
    currentUserId: string
    parentId: string | null
    content: string
    author: {
        name: string
        image: string
        id: string
    }
    community: {
        id: string
        name: string
        image: string
    } | null
    createdAt: string
    comments: {
        author: {
            image: string
        }
    }[]
    isComment?: boolean
    isLikedByCurrentUser: boolean
    likeCount: number
    dbUserId: string
    children?: any[]
}

const ThreadCard = ({
    author,
    comments,
    community,
    content,
    createdAt,
    currentUserId,
    id,
    parentId,
    isComment,
    isLikedByCurrentUser,
    likeCount,
    dbUserId,
    children,
}: Props) => {
    const toggleLike = async () => {
        await toggleLikeThread({ threadId: id, userId: dbUserId })
    }

    const repliesImages = Array.from(
        new Map(
            children
                ?.filter((item) => item?.author?.image)
                ?.map((item) => [item.author._id, item.author])
        ).values()
    )
    return (
        <article
            className={
                "flex w-full flex-col rounded-xl " +
                (isComment ? " px-0 xs:px-7" : " bg-dark-2 p-7")
            }
        >
            <div className="flex items-start justify-between">
                <div className="flex w-full flex-1 flex-row gap-4">
                    <div className="flex flex-col items-center">
                        <Link
                            href={"/profile/" + author.id}
                            className="relative size-11"
                        >
                            <Image
                                src={author.image ?? "/assets/logo.svg"}
                                alt="profile image"
                                fill
                                className="cursor-pointer rounded-full"
                            />
                        </Link>
                        <div className="thread-card_bar"></div>
                    </div>
                    <div className="flex w-full flex-col">
                        <Link href={"/profile/" + author.id} className="w-fit">
                            <h4 className="cursor-pointer text-base-semibold text-light-1">
                                {author.name}
                            </h4>
                        </Link>
                        <p className="mt-2 text-small-regular text-light-2">
                            {content}
                        </p>
                        <div
                            className={
                                "mt-5 flex flex-col gap-3 " +
                                (isComment && " mb-10")
                            }
                        >
                            <div className="flex gap-3.5">
                                <button
                                    onClick={toggleLike}
                                    className="bg-transparent flex"
                                >
                                    {isLikedByCurrentUser ? (
                                        <Image
                                            src="/assets/heart-filled.svg"
                                            alt="heart"
                                            width={24}
                                            height={24}
                                            className="cursor-pointer object-contain animate-out"
                                        />
                                    ) : (
                                        <Image
                                            src="/assets/heart-gray.svg"
                                            alt="heart"
                                            width={24}
                                            height={24}
                                            className="cursor-pointer object-contain"
                                        />
                                    )}
                                    {likeCount}
                                </button>
                                <Link href={"/thread/" + id}>
                                    <Image
                                        src="/assets/reply.svg"
                                        alt="heart"
                                        width={24}
                                        height={24}
                                        className="cursor-pointer object-contain"
                                    />
                                </Link>
                                <Image
                                    src="/assets/repost.svg"
                                    alt="heart"
                                    width={24}
                                    height={24}
                                    className="cursor-pointer object-contain"
                                />
                                <Image
                                    src="/assets/share.svg"
                                    alt="heart"
                                    width={24}
                                    height={24}
                                    className="cursor-pointer object-contain"
                                />
                            </div>
                            {isComment && comments.length > 0 && (
                                <Link href={"/thread/" + id}>
                                    <p className="mt-1 text-subtle-medium text-gray-1">
                                        {comments.length} replies
                                    </p>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
                {/* todo: delete thread */}
            </div>
            {Array.isArray(children) && children?.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                        {repliesImages
                            .slice(0, Math.min(5, repliesImages.length))
                            .map((author, index) => (
                                <Image
                                    src={author.image}
                                    alt={author.name || author._id}
                                    width={30}
                                    height={30}
                                    key={author._id}
                                    className="rounded-full border-2 border-white -ml-3 first:ml-0"
                                    style={{ zIndex: index }}
                                />
                            ))}
                    </div>
                    <p className="text-xs whitespace-nowrap">
                        {children?.length} replies
                    </p>
                </div>
            )}
            {!isComment && community && (
                <Link
                    href={"/communities/" + community.id}
                    className="mt-5 flex items-center"
                >
                    <p className="text-subtle-medium text-gray-1">
                        {formatDateString(createdAt)} - {community.name}{" "}
                        Community
                    </p>
                    <Image
                        src={community.image ?? null}
                        alt={community.name}
                        width={14}
                        height={14}
                        className="rounded-full object-cover ms-1"
                    />
                </Link>
            )}
        </article>
    )
}

export default ThreadCard
