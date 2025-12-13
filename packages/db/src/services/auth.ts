import { client } from "../index.ts";
import { ApiError } from "@repo/common"; 

export const createUser = async (
    name: string,
    email: string,
    hashPassword: string
) => {
    try {
        return await client.user.create({
            data: { email, name, password: hashPassword },
        });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

export const getUserByEmail = async (email: string) => {
    try {
        return await client.user.findUnique({ where: { email } });
    } catch (error) {
        throw new ApiError(
            400,
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

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


