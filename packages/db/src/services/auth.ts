import { client } from "../index.ts";
import { ApiError } from "@repo/common";

export const getUserById = async (id: string) => {
    try {
        return await client.user.findUnique({
            where: { id },
        });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};
