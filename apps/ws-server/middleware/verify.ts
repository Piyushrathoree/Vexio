import { auth } from "@repo/auth";

const verifyUser = async (token: string): Promise<string | null> => {
    if (!token) {
        return null;
    }

    try {
        const session = await auth.api.getSession({
            headers: new Headers({
                Authorization: `Bearer ${token}`,
            }),
        });

        if (!session?.user?.id) {
            console.log("[Vexio:WS] auth failed — invalid bearer token");
            return null;
        }

        return session.user.id;
    } catch (err) {
        console.error("[Vexio:WS] auth error", err);
        return null;
    }
};

export default verifyUser;
