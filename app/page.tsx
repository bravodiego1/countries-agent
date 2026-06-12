"use client";

import { useEffect, useState } from "react";
import SidebarHistory from "@/components/sideBarHistory";
import ChatMessages from "@/components/chatMessages";
import ChatInput from "@/components/chatInput";
import ToolsInspector from "@/components/toolsInspector";

export default function Home() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastToolsExecuted, setLastToolsExecuted] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [votedMessages, setVotedMessages] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    let currentSessionId = localStorage.getItem("country_agent_session");
    if (!currentSessionId) {
      currentSessionId = "session_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("country_agent_session", currentSessionId);
    }
    setSessionId(currentSessionId);
    fetch(`/api/history?sessionId=${currentSessionId}`)
      .then(res => res.json())
      .then(data => setHistory(data.history || []));
  }, []);

  async function sendMessage() {

    if (!message.trim()) return;

    const userMessage = message;
    
    setChat(prev => [...prev, { role: "user", content: userMessage }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, sessionId }),
      });

      const data = await res.json();
      const fallbackAnswer = data.answer || "El servicio no retornó datos válidos para este país.";

      setChat(prev => [...prev, { role: "assistant", content: fallbackAnswer }]);

      setLastToolsExecuted(data.tools && data.tools.length > 0 ? data.tools : []);

      fetch(`/api/history?sessionId=${sessionId}`)
        .then(res => res.json())
        .then(data => setHistory(data.history || []));

    } catch (err) {
      console.error("Error en la petición de chat:", err);
      setChat(prev => [...prev, { role: "assistant", content: "Ocurrió un error de red al procesar la solicitud." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(msgIndex: number, vote: "thumbs_up" | "thumbs_down") {
    if (votedMessages[msgIndex]) return;
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, messageIndex: msgIndex, voteType: vote }),
      });
      if (res.ok) {
        setVotedMessages(prev => ({
          ...prev,
          [msgIndex]: vote === "thumbs_up" ? "👍 ¡Gracias!" : "👎 Registrado",
        }));
      }
    } catch (error) {
      console.error("Error enviando feedback a la API:", error);
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "sans-serif", backgroundColor: "#0f172a" }}>
      <SidebarHistory history={history} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <ChatMessages
          chat={chat}
          loading={loading}
          votedMessages={votedMessages}
          onFeedback={handleFeedback}
        />
        <ChatInput
          message={message}
          setMessage={setMessage}
          onSend={sendMessage}
        />
      </div>

      <ToolsInspector tools={lastToolsExecuted} />
    </div>
  );
}
