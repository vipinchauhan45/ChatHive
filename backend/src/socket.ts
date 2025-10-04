import { WebSocketServer, WebSocket as WS } from "ws";
import { User } from "./models/user.js";
import { RoomManager } from "./roomManager.js";

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });
const roomManager = new RoomManager();

wss.on("connection", async (socket: WS) => {
  console.log("✅ New user connected");

  socket.on("message", async (rawMessage) => {
    let parsed: any;
    try {
      parsed = JSON.parse(rawMessage.toString());
    } catch (err) {
      console.error("❌ Invalid JSON:", err);
      return;
    }

    if (parsed.type === "location") {
      // Initialize location object
      let userLocation = {
        continent: null as string | null,
        country: null as string | null,
        state: null as string | null,
        local: null as string | null,
        isAddress: false,
      };

      // Try reverse geocoding
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${parsed.latitude}&longitude=${parsed.longitude}&localityLanguage=en`
        );
        const geo = await res.json();

        userLocation = {
          continent: geo?.continent || null,
          country: geo?.countryName || geo?.country || null,
          state: geo?.principalSubdivision || geo?.state || null,
          local: geo?.city || geo?.locality || null,
          isAddress: true,
        };
      } catch (e) {
        console.warn("Reverse geocoding failed, trying IP lookup:", e);
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          const ipData = await ipRes.json();

          userLocation = {
            continent: null,
            country: ipData?.country_name || null,
            state: ipData?.region || null,
            local: ipData?.city || null,
            isAddress: true,
          };
        } catch (e) {
          console.error("IP lookup failed:", e);
          userLocation = {
            continent: null,
            country: "Unknown",
            state: null,
            local: null,
            isAddress: false,
          };
        }
      }

      if (socket.readyState === WS.OPEN) {
        const user = new User(socket, userLocation);
        roomManager.registerUser(user);
      }
    } 
    else if (parsed.type === "chat") {
      if (!parsed.roomId || !parsed.userId || !parsed.message) {
        console.warn("Invalid chat payload:", parsed);
        return;
      }

      // Pass type explicitly to satisfy TypeScript
      roomManager.deliverMessage({
        type: "message",
        roomId: parsed.roomId,
        userId: parsed.userId,
        message: parsed.message,
      });
    } 
    else if (parsed.type === "newChat") {
      if (!parsed.roomId) {
        console.warn("Invalid terminate payload:", parsed);
        return;
      }

      roomManager.terminateRoom({
        type: "CLOSE",
        roomId: parsed.roomId,
      });
    }
    else if(parsed.type === "STOP"){
      roomManager.handleSocketDisconnect(socket);
    }
  });

  socket.on("close", () => {
    console.log("Socket closed");
    roomManager.handleSocketDisconnect(socket);
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
    roomManager.handleSocketDisconnect(socket);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
