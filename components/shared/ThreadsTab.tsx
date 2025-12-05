import { fetchUserPosts } from "@/lib/actions/user.actions"
import { redirect } from "next/navigation"
import ThreadCard from "../cards/ThreadCard"
import { fetchCommunityPosts } from "@/lib/actions/community.actions"

interface ThreadsTabProps {
    currentUserId: string
    accountId: string
    accountType: string
}

const ThreadsTab = async ({
    currentUserId,
    accountId,
    accountType,
}: ThreadsTabProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any
    if (accountType === "User") {
        result = await fetchUserPosts(accountId)
    } else {
        result = await fetchCommunityPosts(accountId)
    }

    if (!result) redirect("/")
    return (
        <section className="mt-9 flex flex-col gap-10">
            {result.threads.map((thread) => (
                <ThreadCard
                    key={thread._id?.toString()}
                    id={thread._id?.toString()}
                    currentUserId={currentUserId}
                    parentId={thread.parentId?.toString()}
                    content={thread.text}
                    author={
                        accountType === "User"
                            ? {
                                  name: result.name,
                                  image: result.image,
                                  id: result.id.toString(),
                              }
                            : thread.author
                    }
                    community={thread.community}
                    createdAt={thread.createdAt}
                    comments={thread.children}
                    isLikedByCurrentUser={thread.isLikedByCurrentUser}
                    likeCount={thread.likeCount}
                    dbUserId={accountId}
                />
            ))}
        </section>
    )
}

export default ThreadsTab
