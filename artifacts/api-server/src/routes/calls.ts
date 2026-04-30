import { Router, type IRouter } from "express";

const router: IRouter = Router();

const DAILY_API = "https://api.daily.co/v1";

interface DailyRoomResponse {
  id: string;
  name: string;
  url: string;
  privacy: string;
  created_at: string;
  config?: Record<string, unknown>;
}

router.post("/calls/room", async (req, res) => {
  const apiKey = process.env["DAILY_API_KEY"];
  if (!apiKey) {
    req.log.error("DAILY_API_KEY is not set");
    return res.status(503).json({ error: "calling_not_configured" });
  }

  const body = req.body as {
    callId?: string;
    type?: "voice" | "video";
  };

  const callId = body.callId;
  const type = body.type ?? "video";

  if (!callId || typeof callId !== "string") {
    return res.status(400).json({ error: "callId required" });
  }

  // Daily room names: lowercase, alphanumeric and hyphens, <= 41 chars
  const safeName = callId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 41);

  const expSeconds = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour

  try {
    const response = await fetch(`${DAILY_API}/rooms`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: safeName,
        privacy: "public",
        properties: {
          exp: expSeconds,
          eject_at_room_exp: true,
          enable_prejoin_ui: false,
          enable_screenshare: false,
          enable_chat: false,
          start_video_off: type === "voice",
          start_audio_off: false,
          max_participants: 2,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      // Daily.co returns 409, OR 400 with body containing "already exists",
      // when a room with this name was created previously. In both cases the
      // existing room is still usable for this call, so fetch and reuse it.
      const alreadyExists =
        response.status === 409 ||
        (response.status === 400 && /already exists/i.test(errText));
      if (alreadyExists) {
        const existing = await fetch(`${DAILY_API}/rooms/${safeName}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (existing.ok) {
          const room = (await existing.json()) as DailyRoomResponse;
          return res.json({ url: room.url, name: room.name });
        }
        req.log.error(
          { status: existing.status, name: safeName },
          "daily room exists but fetch failed",
        );
      }
      req.log.error({ status: response.status, errText }, "daily room create failed");
      return res.status(502).json({ error: "room_create_failed" });
    }

    const room = (await response.json()) as DailyRoomResponse;
    return res.json({ url: room.url, name: room.name });
  } catch (err) {
    req.log.error({ err }, "daily room create exception");
    return res.status(502).json({ error: "room_create_exception" });
  }
});

export default router;
