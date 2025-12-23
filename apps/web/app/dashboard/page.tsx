"use client";

import { Tldraw } from "@tldraw/tldraw";

export default function BoardPage() {
    return (
        <div className="h-screen w-screen fixed ">
            <Tldraw
                onMount={(editor) => {
                    editor.store.listen((change) => {
                        console.log("CANVAS CHANGE", change);
                    });
                }}
            />
        </div>
    );
}
