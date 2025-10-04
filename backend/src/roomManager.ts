import { User } from "./models/user.js";
import { Room } from "./models/room.js";
import { calculateMatch } from "./match.js";
import { WebSocket as WS } from "ws";

interface msgPayload {
  type: "message" | "CUTCONNECTION" | "CLOSE";
  roomId?: string;
  userId?: string;
  partner?: string;
  message?: string;
}

function safeSend(ws: WS, payload: any) {
  if (ws.readyState === WS.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function notifyMatch(user1: User, user2: User, room: Room) {
  safeSend(user1.ws, {
    type: "matched",
    roomId: room.id,
    partner: user2.id,
    user: user1.id,
  });

  safeSend(user2.ws, {
    type: "matched",
    roomId: room.id,
    partner: user1.id,
    user: user2.id,
  });
}

export class RoomManager {
  waitingUsers: Map<string, User> = new Map();
  activeRooms: Map<string, Room> = new Map(); // Use roomId -> Room for faster lookup
  userSockets: Map<string, WS> = new Map();

  registerUser(user: User) {
    // Close old socket if exists
    const oldSocket = this.userSockets.get(user.id);
    if (oldSocket && oldSocket !== user.ws && oldSocket.readyState === WS.OPEN) {
      oldSocket.close();
    }
    this.userSockets.set(user.id, user.ws);

    // Remove from waiting list if exists
    this.waitingUsers.delete(user.id);

    // Try to find best match
    let bestMatch: { partner: User; score: number } | null = null;
    for (const partner of this.waitingUsers.values()) {
      const score = calculateMatch(user, partner);
      if (!bestMatch || score > bestMatch.score) bestMatch = { partner, score };
      if (score >= 0.2) break;
    }

    if (bestMatch && bestMatch.score >= 0.2) {
      this.waitingUsers.delete(bestMatch.partner.id);
      const room = new Room(user, bestMatch.partner);
      this.activeRooms.set(room.id, room);
      notifyMatch(user, bestMatch.partner, room);
    } else if (this.waitingUsers.size > 0) {
      // Pick first waiting user
      const firstPartner = this.waitingUsers.values().next().value;
      if (firstPartner) {
        this.waitingUsers.delete(firstPartner.id);
        const room = new Room(user, firstPartner);
        this.activeRooms.set(room.id, room);
        notifyMatch(user, firstPartner, room);
      } else {
        this.waitingUsers.set(user.id, user);
        safeSend(user.ws, { type: "waiting" });
      }
    } else {
      this.waitingUsers.set(user.id, user);
      safeSend(user.ws, { type: "waiting" });
    }
  }

  deliverMessage(message: msgPayload) {
    if (!message.roomId) return;
    const room = this.activeRooms.get(message.roomId);
    if (!room) return;

    const sender = room.user1.id === message.userId ? room.user1 : room.user2;
    const receiver = sender === room.user1 ? room.user2 : room.user1;

    safeSend(sender.ws, {
      type: "DELIVER_MESSAGE",
      roomId: room.id,
      message: message.message,
      sender: "me",
    });

    safeSend(receiver.ws, {
      type: "DELIVER_MESSAGE",
      roomId: room.id,
      message: message.message,
      sender: "other",
    });
  }

  terminateRoom(msg: msgPayload) {
    if (!msg.roomId) return;
    const room = this.activeRooms.get(msg.roomId);
    if (!room) return;

    this.activeRooms.delete(room.id);

    [room.user1, room.user2].forEach((user) => {
      if (user.ws.readyState === WS.OPEN) {
        safeSend(user.ws, { type: "CUTCONNECTION", message: "trying to connect with new user" });
        this.registerUser(user);
      }
    });
  }

  handleSocketDisconnect(socket: WS) {
    // Remove from waiting users
    for (const [id, user] of this.waitingUsers) {
      if (user.ws === socket) this.waitingUsers.delete(id);
    }

    // Remove from userSockets
    for (const [userId, ws] of this.userSockets) {
      if (ws === socket) this.userSockets.delete(userId);
    }

    // Remove from active rooms
    for (const room of Array.from(this.activeRooms.values())) {
      if (room.user1.ws === socket || room.user2.ws === socket) {
        this.activeRooms.delete(room.id);
        const remainingUser = room.user1.ws === socket ? room.user2 : room.user1;
        if (remainingUser.ws.readyState === WS.OPEN) this.registerUser(remainingUser);
      }
    }
  }

  handleSocketClose(socket: WS) {
    // Simply call disconnect logic
    this.handleSocketDisconnect(socket);
  }
}
