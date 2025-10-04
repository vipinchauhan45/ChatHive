import crypto from "crypto";
import { User } from "./user.js";

export class Room {
  id: string;
  user1: User;
  user2: User;

  constructor(user1: User, user2: User) {
    this.user1 = user1;
    this.user2 = user2;
    this.id = crypto.randomUUID();
  }

  broadcast(sender: User, message: string) {
    const payload = {
      type: "DELIVER_MESSAGE",
      senderId: sender.id,
      message,
    };

    [this.user1, this.user2].forEach((u) => {
      if (u.ws.readyState === 1) {
        u.ws.send(JSON.stringify(payload));
      }
    });
  }

  otherUser(sender: User): User {
    return this.user1.id === sender.id ? this.user2 : this.user1;
  }
}
