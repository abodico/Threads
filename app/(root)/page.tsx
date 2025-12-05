/* eslint-disable @typescript-eslint/no-explicit-any */
import ThreadCard from "@/components/cards/ThreadCard"
import { fetchPosts } from "@/lib/actions/thread.actions"
import { fetchUser } from "@/lib/actions/user.actions"
import { currentUser } from "@clerk/nextjs/server"

export default async function Home() {
    const user = await currentUser()
    const dbUser = await fetchUser(user?.id ?? "")

    const result = await fetchPosts({
        pageNumber: 1,
        pageSize: 30,
        sessionUserId: dbUser?._id ?? "",
    })

    // Ensure data is serialized properly
    const safePosts = result.posts.map((post) => ({
        ...post,
        _id: String(post._id),
        parentId: post.parentId ? String(post.parentId) : null,
        createdAt:
            typeof post.createdAt === "string"
                ? post.createdAt
                : new Date(post.createdAt).toISOString(),
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

    return (
        <>
            <h1 className="head-text text-start">Home</h1>

            <section className="mt-9 flex flex-col gap-10">
                {safePosts.map((post) => (
                    <ThreadCard
                        key={post._id}
                        id={post._id}
                        currentUserId={user?.id ?? ""}
                        parentId={post.parentId}
                        content={post.text}
                        author={post.author}
                        community={post.community}
                        createdAt={post.createdAt}
                        comments={post.children}
                        isLikedByCurrentUser={post.isLikedByCurrentUser}
                        likeCount={post.likeCount}
                        dbUserId={String(dbUser?._id ?? "")}
                        // eslint-disable-next-line react/no-children-prop
                        children={post.children}
                    />
                ))}
            </section>
        </>
    )
}
