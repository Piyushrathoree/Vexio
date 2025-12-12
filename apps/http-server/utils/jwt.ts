import jwt from "jsonwebtoken";

const generateToken = (data: { userId: string; email: string }) => {
    return jwt.sign(data, process.env.JWT_SECRET!); 
};

const verifyToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_SECRET!);
};
export { generateToken, verifyToken };
