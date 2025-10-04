import { WebSocket as WS } from "ws";
import crypto from "crypto";

interface Location {
  continent?: string | null;
  country?: string | null;
  state?: string | null;
  local?: string | null;
  isAddress?: boolean;
}

export class User {
  id: string;
  ws: WS;
  continent: string | null;
  country: string | null;
  state: string | null;
  local: string | null;
  waitingSince: number;
  isAddress: boolean;

  constructor(ws: WS, location: Location) {
    this.id = crypto.randomUUID();
    this.ws = ws;
    this.continent = location?.continent || null;
    this.country = location?.country || null;
    this.state = location?.state || null;
    this.local = location?.local || null;
    this.isAddress = location?.isAddress || false;
    this.waitingSince = Date.now();
  }
}

