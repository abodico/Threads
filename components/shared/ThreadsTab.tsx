import { fetchUserPosts } from "@/lib/actions/user.actions"
import { redirect } from "next/navigation"
import ThreadCard from "../cards/ThreadCard"

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
    // todo fetch profile threads

    const result = await fetchUserPosts(accountId)
    if (!result) redirect("/")
    return (
        <section className="mt-9 flex flex-col gap-10">
            {result.threads.map((thread) => (
                <ThreadCard
                    key={thread._id}
                    id={thread._id}
                    currentUserId={currentUserId}
                    parentId={thread.parentId}
                    content={thread.text}
                    author={
                        accountType === "User"
                            ? {
                                  name: result.name,
                                  image: result.image,
                                  id: result.id,
                              }
                            : thread.author
                    } //todo: update the author
                    community={thread.community} // todo: update the community
                    createdAt={thread.createdAt}
                    comments={thread.children}
                />
            ))}
        </section>
    )
}

export default ThreadsTab
