export type ClientMessage =
    | { type: "join_room"; slug: string }
    | { type: "leave_room"; slug: string }
    | { type: "element_add"; slug: string; element: unknown }
    | { type: "element_update"; slug: string; element: unknown }
    | { type: "element_delete"; slug: string; elementId: string }
    // Ephemeral presence — relayed to room peers, never persisted.
    | { type: "cursor"; slug: string; x: number; y: number }
    | { type: "selection"; slug: string; elementIds: string[] };

export type ServerMessage =
    | { type: "room_state"; slug: string; elements: unknown[] }
    | { type: "element_add"; slug: string; element: unknown; userId: string }
    | { type: "element_update"; slug: string; element: unknown; userId: string }
    | { type: "element_delete"; slug: string; elementId: string; userId: string }
    | {
          type: "presence";
          slug: string;
          userId: string;
          name: string;
          action: "joined" | "left";
      }
    // Ephemeral presence — mirror of the client messages above, fanned out to peers.
    | {
          type: "cursor";
          slug: string;
          userId: string;
          name: string;
          x: number;
          y: number;
      }
    | {
          type: "selection";
          slug: string;
          userId: string;
          name: string;
          elementIds: string[];
      }
    | { type: "error"; message: string };

export type RoomRole = "ADMIN" | "EDITOR" | "VIEWER";

export type RoomSession = {
    roomId: number;
    slug: string;
    // Resolved at join time; VIEWERs may observe and move their cursor but may
    // not mutate room state.
    role: RoomRole;
};
