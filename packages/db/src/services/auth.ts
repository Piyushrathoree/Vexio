import { client } from "..";

export const createUser = async (
    name: string,
    email: string,
    hashPassword: string
) => {
    return client.user.create({
        data: { name, email, password: hashPassword },
    });
};

export const getUserByEmail = async (email: string) => {
    return client.user.findUnique({ where: { email } });
};

export const getUserById = async(id : number) =>{
    return client.user.findUnique({where:{
        id
    }})
}