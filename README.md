# README.md

## 🌍 Location-Based WebSocket Chat App

### 💬 Overview

This project is a **real-time chat application** that matches users based on their **geographical location**.
It uses **WebSockets** for instant communication, and the **matching algorithm** pairs users nearby using live geolocation data.

Built with:

* **React (TypeScript)** on the frontend
* **WebSocket (ws)** on the backend
* **BigDataCloud / IPAPI** for location lookup

Users can:

* Connect and get matched automatically
* Chat in real-time
* Skip to the next partner
* Stop or restart anytime

---

## ⚡ Features

✅ **Live Matching Based on Location**
Users are matched automatically using their latitude and longitude.

✅ **Real-time Messaging (WebSocket)**
Messages are delivered instantly with sender/receiver distinction.

✅ **Anonymous Chat**
No login or registration required — users are represented by unique IDs.

✅ **Smart Reconnection**
If a partner disconnects, the system automatically finds a new match.

✅ **Geolocation Fallbacks**
If browser location is denied, IP-based geolocation is used.

✅ **Modern Responsive UI**
Built with React + TailwindCSS — works on desktop and mobile.

---

## ⚙️ Tech Stack

| Layer         | Technology                                |
| ------------- | ----------------------------------------- |
| Frontend      | React (TypeScript), TailwindCSS, Vite     |
| Backend       | TypeScript, ws (WebSocket)                |
| Location      | BigDataCloud Reverse Geocoding API, IPAPI |
| Communication | WebSocket protocol                        |
| Matching      | Custom proximity-based algorithm          |

---

### 2️⃣ Setup Backend

```bash
cd backend
npm install
npm run dev
```

Server runs by default on:

```
ws://localhost:8080
```

---

### 3️⃣ Setup Frontend

```bash
cd ../frontend/vite-project
npm install
npm run dev
```

Then open the app at:

```
http://localhost:5173
```

---

## 🌐 How It Works

1. When you click **Start**, the frontend requests your **location** via the browser.
2. The frontend sends it to the **WebSocket server**.
3. The backend uses **reverse geocoding** (BigDataCloud/IPAPI) to convert coordinates into region/state/country.
4. The **RoomManager** pairs you with a user.
5. Both clients receive a `"matched"` event with their room ID.
6. Messages are exchanged instantly through WebSocket.

---

## 🧠 Matching Logic

The matching algorithm in `match.ts` calculates **dissimilarity score** based on:

* Country / State proximity
* Same city preference
* Random fallback if no match

If the score ≥ 0.2 → users are paired.
Otherwise, the user is added to the waiting pool.

---

## 🧾 License

MIT License © 2025 — Developed by **Vipin**
