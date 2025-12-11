import bcrypt from "bcryptjs";

const hashPassword = (password: string) => {
    return bcrypt.hash(password, 10);
};

const comparePassword = (password: string, hashPassword: string) => {
    return bcrypt.compare(password, hashPassword);
};

export {hashPassword , comparePassword}