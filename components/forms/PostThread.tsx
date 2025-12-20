"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ThreadValidation } from "@/lib/validations/thread"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Textarea } from "../ui/textarea"
import { useRouter, usePathname } from "next/navigation"
import { createThread } from "@/lib/actions/thread.actions"
import { useOrganization } from "@clerk/nextjs"

const PostThread = ({ userId }: { userId: string }) => {
    const pathname = usePathname()
    const router = useRouter()
    const organization = useOrganization()

    const form = useForm<z.infer<typeof ThreadValidation>>({
        resolver: zodResolver(ThreadValidation),
        defaultValues: {
            thread: "",
            accountId: userId,
        },
    })

    const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
        try {
            await createThread({
                text: values.thread,
                author: userId,
                communityId: !organization.organization?.id
                    ? null
                    : organization?.organization?.id,
                path: pathname,
            })

            router.push("/")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw new Error("error creating thread:" + error.message)
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-10 flex flex-col justify-start gap-10"
            >
                <FormField
                    control={form.control}
                    name="thread"
                    render={({ field }) => (
                        <FormItem className="flex flex-col  gap-3 w-full">
                            <FormLabel className="text-base-semibold text-light-2">
                                Content
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    rows={15}
                                    className="no-focus border border-dark-4 bg-dark-3 text-light-1"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="bg-primary-500">
                    Post Thread
                </Button>
            </form>
        </Form>
    )
}

export default PostThread
