import ThreadCard from "@/components/cards/ThreadCard"
import Comment from "@/components/forms/Comment"
import { fetchThreadById } from "@/lib/actions/thread.actions"
import { fetchUser } from "@/lib/actions/user.actions"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

const page = async ({ params }: { params: { id: string } }) => {
    const Params = await params
    if (!Params?.id) return null

    const user = await currentUser()
    if (!user) return null

    const userInfo = await fetchUser(user.id)
    if (!userInfo?.onboarded) redirect("/onboarding")

    const thread = await fetchThreadById(Params.id)
    return (
        <section className="relative">
            <div className="">
                <ThreadCard
                    key={thread._id}
                    id={thread._id}
                    currentUserId={user?.id ?? ""}
                    parentId={thread.parentId}
                    content={thread.text}
                    author={thread.author}
                    community={thread.community}
                    createdAt={thread.createdAt}
                    comments={thread.children}
                    isLikedByCurrentUser={thread.isLikedByCurrentUser}
                    likeCount={thread.likeCount}
                    dbUserId={userInfo._id}
                />
            </div>

            <div className="mt-7">
                <Comment
                    threadId={thread._id}
                    currentUserImage={userInfo.image}
                    currentUserId={userInfo._id?.toString()}
                />
            </div>

            <div className="mt-10">
                {thread.children.map((childItem) => (
                    <ThreadCard
                        key={childItem._id}
                        id={childItem._id}
                        currentUserId={childItem?.id ?? ""}
                        parentId={childItem.parentId}
                        content={childItem.text}
                        author={childItem.author}
                        community={childItem.community}
                        createdAt={childItem.createdAt}
                        comments={childItem.children}
                        isComment
                        isLikedByCurrentUser={childItem.isLikedByCurrentUser}
                        likeCount={childItem.likeCount}
                        dbUserId={userInfo._id}
                    />
                ))}
            </div>
        </section>
    )
}

export default page
