"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { CommentValidation } from "@/lib/validations/thread"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import { Input } from "../ui/input"
import { usePathname } from "next/navigation"
import { addCommentToThread } from "@/lib/actions/thread.actions"
import Image from "next/image"

interface Props {
    threadId: string
    currentUserImage: string
    currentUserId: string
}

const Comment = ({ threadId, currentUserImage, currentUserId }: Props) => {
    const pathname = usePathname()

    const form = useForm<z.infer<typeof CommentValidation>>({
        resolver: zodResolver(CommentValidation),
        defaultValues: {
            thread: "",
        },
    })

    const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
        try {
            await addCommentToThread({
                threadId: threadId,
                commentText: values.thread,
                userId: currentUserId,
                path: pathname,
            })
            form.reset()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw new Error("error creating thread:" + error.message)
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="comment-form"
            >
                <FormField
                    control={form.control}
                    name="thread"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3 w-full">
                            <FormLabel>
                                <Image
                                    src={currentUserImage}
                                    alt="profile image"
                                    width={48}
                                    height={48}
                                    className="rounded-full object-cover"
                                />
                            </FormLabel>
                            <FormControl className="border-none bg-transparent">
                                <Input
                                    type="text"
                                    placeholder="Comment..."
                                    className="no-focus border outline-none text-light-1"
                                    {...field}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <Button type="submit" className="comment-form_btn">
                    Reply
                </Button>
            </form>
        </Form>
    )
}

export default Comment
