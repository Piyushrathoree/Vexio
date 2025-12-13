import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/common";

const generateToken = (data: { userId: string; email: string }) => {
    return jwt.sign(data, JWT_SECRET!); 
};

const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET!);
};
export { generateToken, verifyToken };
