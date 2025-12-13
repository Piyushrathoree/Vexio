import { JWT_SECRET, jwt } from "@repo/common";

const verifyUser = (token: string): string | null => {
    if (!token) {
        return null;
    }
    const decoded = jwt.verify(token, JWT_SECRET!);
    if (!decoded || typeof decoded !== "object") {
        return null;
    }

    return decoded.userId;
};

export default verifyUser