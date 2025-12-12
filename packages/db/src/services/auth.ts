import { client } from "../index.ts";

export const createUser = async (
    name: string,
    email: string,
    hashPassword: string
) => {
    return client.user.create({
        data: { email, name, password: hashPassword },
    });
};

export const getUserByEmail = async (email: string) => {
    return client.user.findUnique({ where: { email } });
};

export const getUserById = async (id: string) => {
    return client.user.findUnique({
        where: {
            id,
        },
    });
};
