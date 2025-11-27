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
    // todo fetch profile threads

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
