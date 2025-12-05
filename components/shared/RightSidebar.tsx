import { fetchUsers } from "@/lib/actions/user.actions"
import { currentUser } from "@clerk/nextjs/server"
import UserCard from "../cards/UserCard"
import CommunityCard from "../cards/CommunityCard"
import { fetchCommunities } from "@/lib/actions/community.actions"

const RightSidebar = async () => {
    const user = await currentUser()
    // fetch users
    const result = await fetchUsers({
        userId: user?.id ?? "",
        searchString: "",
        pageNumber: 1,
        pageSize: 25,
    })

    // fetch communities
    const communities = await fetchCommunities({
        searchString: "",
        pageNumber: 1,
        pageSize: 25,
    })

    return (
        <section className="custom-scrollbar rightsidebar">
            <div className="flex flex-1 flex-col justify-start">
                <h3 className="text-heading4-medium text-light-1">
                    Suggested Communities
                </h3>
                <div className="mt-14 flex flex-col gap-9">
                    {communities.communities.length === 0 ? (
                        <p className="no-result">No communities</p>
                    ) : (
                        <>
                            {communities.communities.map((community) => (
                                <CommunityCard
                                    key={community.id}
                                    id={community.id}
                                    name={community.name}
                                    username={community.username}
                                    imgUrl={community.image}
                                    bio={community.bio}
                                    members={community.members}
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>
            <div className="flex flex-1 flex-col justify-start">
                <h3 className="text-heading4-medium text-light-1">
                    Suggested Users
                </h3>
                <div className="mt-14 flex flex-col gap-9">
                    {result.users.length === 0 ? (
                        <p className="no-result">No users</p>
                    ) : (
                        <>
                            {result.users.map((person) => (
                                <UserCard
                                    key={person.id}
                                    id={person.id}
                                    name={person.name}
                                    username={person.username}
                                    imageUrl={person.image}
                                    personType="User"
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}

export default RightSidebar
