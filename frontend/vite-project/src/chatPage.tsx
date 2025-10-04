import { useEffect, useRef, useState } from "react";

interface ServerPayload {
  type: "matched" | "waiting" | "DELIVER_MESSAGE" | "CUTCONNECTION";
  roomId?: string;
  partner?: string;
  user?: string;
  message?: string;
  sender?: "me" | "other"; 
}

interface OutgoingMessage {
  type: "chat";
  roomId: string;
  userId: string;
  message: string;
}

interface ChatMessage {
  id: number;
  text: string;
  sender: "me" | "other";
}

export default function ChatPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Click Start to connect");
  const [isStartDisabled, setIsStartDisabled] = useState(false);
  const [isStopDisabled, setIsStopDisabled] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket setup
  const setupWebSocket = () => {
    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("Connected! Sending location...");
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            ws.send(
              JSON.stringify({
                type: "location",
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              })
            );
          },
          () => {
            ws.send(JSON.stringify({ type: "location" }));
          }
        );
      } else {
        ws.send(JSON.stringify({ type: "location" }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data: ServerPayload = JSON.parse(event.data);
        console.log("Received:", data);

        switch (data.type) {
          case "waiting":
            setStatus("Waiting for a partner...");
            setRoomId(null);
            setPartnerId(null);
            break;

          case "matched":
            setStatus("Matched! Start chatting...");
            setRoomId(data.roomId ?? null);
            setPartnerId(data.partner ?? null);
            setUserId(data.user ?? null);
            setMessages([]);
            setIsStopDisabled(false);
            break;

          case "DELIVER_MESSAGE":
            if (data.message && data.sender) {
              const newMessage: ChatMessage = {
                id: Date.now(),
                text: data.message,
                sender: data.sender,
              };
              setMessages((prev) => [...prev, newMessage]);
            }
            break;

          case "CUTCONNECTION":
            setStatus("Partner disconnected. Reconnecting...");
            setRoomId(null);
            setPartnerId(null);
            setMessages([]);
            setIsStartDisabled(false);
            setIsStopDisabled(true);
            break;
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    ws.onclose = () => {
      setStatus("Disconnected from server");
      setIsStartDisabled(false);
      setIsStopDisabled(true);
    };

    ws.onerror = () => setStatus("Error connecting to server");
  };

  // Send a chat message
  const sendMessage = () => {
    if (!input.trim() || !roomId || !userId || !wsRef.current) return;

    const msg: OutgoingMessage = {
      type: "chat",
      roomId,
      userId,
      message: input.trim(),
    };

    wsRef.current.send(JSON.stringify(msg));
    setInput("");
  };

  // Start connection
  const handleStart = () => {
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      setupWebSocket();
      setStatus("Connecting to server...");
      setIsStartDisabled(true);
      setIsStopDisabled(false);
    }
  };

  // Stop chat
  const handleStop = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STOP" }));
      wsRef.current.close();
      setStatus("Chat stopped. Click Start to reconnect.");
      setMessages([]);
      setIsStartDisabled(false);
      setIsStopDisabled(true);
      wsRef.current = null;
    }
  };

  // Next partner
  const handleNext = () => {
    if (roomId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "newChat", roomId }));
      setStatus("Searching for next partner...");
      setMessages([]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 p-2 sm:p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl flex flex-col h-[90vh] sm:h-[85vh]">
        
        <div className="text-center py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold text-sm sm:text-base rounded-t-2xl">
          {status}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-[80%] sm:max-w-[70%] break-words shadow-md ${
                  msg.sender === "me"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="flex items-center p-3 border-t bg-white/70 backdrop-blur-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          <button
            onClick={sendMessage}
            className="ml-2 px-4 py-2 sm:px-5 sm:py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
          >
            Send
          </button>
        </div>

        <div className="flex justify-center gap-3 p-3 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleStart}
            disabled={isStartDisabled}
            className={`px-4 py-2 sm:px-5 sm:py-2 rounded-xl text-white font-medium transition-all ${
              isStartDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            Start
          </button>

          <button
            onClick={handleStop}
            disabled={isStopDisabled}
            className={`px-4 py-2 sm:px-5 sm:py-2 rounded-xl text-white font-medium transition-all ${
              isStopDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            Stop
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 sm:px-5 sm:py-2 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
