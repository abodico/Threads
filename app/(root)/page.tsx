/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import ThreadCard from "@/components/cards/ThreadCard"
import { usePosts } from "@/lib/hooks/usePosts"

export default function Home() {
    const { data, isLoading, isError } = usePosts()
    console.log(data)
    if (isLoading) {
        return <p>Loading...</p>
    }

    if (isError || !data) {
        return <p>Failed to load posts</p>
    }
    return (
        <>
            <h1 className="head-text text-start">Home</h1>

            <section className="mt-9 flex flex-col gap-10">
                {data.posts.map((post) => (
                    <ThreadCard
                        key={post._id}
                        id={post._id}
                        currentUserId={data?.clerkUserId ?? ""}
                        parentId={post.parentId}
                        content={post.text}
                        author={post.author}
                        community={post.community}
                        createdAt={post.createdAt}
                        comments={post.children}
                        isLikedByCurrentUser={post.isLikedByCurrentUser}
                        likeCount={post.likeCount}
                        dbUserId={String(data?.dbUser ?? "")}
                        // eslint-disable-next-line react/no-children-prop
                        children={post.children}
                    />
                ))}
            </section>
        </>
    )
}
