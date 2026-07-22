-- Backfill: rooms created before 20260713120000_add_room_members_invites have no
-- RoomMember row at all. Every permission check in apps/http-server/controllers
-- resolves through getMember() (RoomMember), not Room.adminId, so without this the
-- owner of a pre-existing room is locked out of their own room with a 403.
INSERT INTO "RoomMember" ("roomId", "userId", "role")
SELECT r."id", r."adminId", 'ADMIN'::"RoomRole"
FROM "Room" r
ON CONFLICT ("roomId", "userId") DO NOTHING;
