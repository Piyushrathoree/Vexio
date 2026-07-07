import { auth } from "@repo/auth";

// The verified identity we hang off each connection. `name` powers live
// cursor/presence labels; it falls back to "" when the session has no name.
export type VerifiedUser = { id: string; name: string };

const verifyUser = async (token: string): Promise<VerifiedUser | null> => {
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

        return { id: session.user.id, name: session.user.name ?? "" };
    } catch (err) {
        console.error("[Vexio:WS] auth error", err);
        return null;
    }
};

export default verifyUser;
