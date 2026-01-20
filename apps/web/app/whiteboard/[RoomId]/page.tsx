import React from "react";
import Canvas from "../componenents/Canvas";

interface PageProps {
    params: Promise<{ roomId: string }>;
}
const WhiteboardPage = async ({ params }: PageProps) => {
    // const { roomId } = await params;
    return (
        <div className="w-screen h-screen overflow-hidden dark:bg-neutral-900 bg-neutral-50">
            <Canvas />
        </div>
    );
};

export default WhiteboardPage;
