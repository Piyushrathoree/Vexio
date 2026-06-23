export type ClientMessage =
    | { type: "join_room"; slug: string }
    | { type: "leave_room"; slug: string }
    | { type: "element_add"; slug: string; element: unknown }
    | { type: "element_update"; slug: string; element: unknown }
    | { type: "element_delete"; slug: string; elementId: string };

export type ServerMessage =
    | { type: "room_state"; slug: string; elements: unknown[] }
    | { type: "element_add"; slug: string; element: unknown; userId: string }
    | { type: "element_update"; slug: string; element: unknown; userId: string }
    | { type: "element_delete"; slug: string; elementId: string; userId: string }
    | { type: "presence"; slug: string; userId: string; action: "joined" | "left" }
    | { type: "error"; message: string };

export type RoomSession = {
    roomId: number;
    slug: string;
};
