import jwt from "jsonwebtoken";

const generateToken = (email: string) => {
    return jwt.sign(email, process.env.JWT_SECRET!);
};

const verifyToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_SECRET!);
};
export { generateToken, verifyToken };
