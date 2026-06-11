"use client";

import { useEffect, useState } from "react";

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
        body: JSON.stringify({ message: userMessage, sessionId: sessionId })
      });

      const data = await res.json();
      const fallbackAnswer = data.answer || "El servicio no retornó datos válidos para este país.";

      setChat(prev => [
        ...prev,
        { role: "assistant", content: fallbackAnswer }
      ]);

      if (data.tools && data.tools.length > 0) {
        setLastToolsExecuted(data.tools);
      } else {
        setLastToolsExecuted([]);
      }

      fetch(`/api/history?sessionId=${sessionId}`)
        .then(res => res.json())
        .then(data => setHistory(data.history || []));

    } catch (err) {
      console.error("Error en la petición de chat:", err);
      setChat(prev => [
        ...prev,
        { role: "assistant", content: "Ocurrió un error de red al procesar la solicitud." }
      ]);
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
        body: JSON.stringify({
          sessionId: sessionId,
          messageIndex: msgIndex,
          voteType: vote,
        }),
      });

      if (res.ok) {
        setVotedMessages(prev => ({
          ...prev,
          [msgIndex]: vote === "thumbs_up" ? "👍 ¡Gracias!" : "👎 Registrado"
        }));
      }
    } catch (error) {
      console.error("Error enviando feedback a la API:", error);
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif", backgroundColor: "#0f172a" }}>
      
      {/* HISTORIAL */}
      <div style={{ width: "25%", borderRight: "1px solid #1e293b", padding: 15, overflowY: "auto", backgroundColor: "#1e293b" }}>
        <h3 style={{ color: "#f8fafc", margin: "0 0 15px 0" }}>📜 Tus Comparaciones</h3>
        {history.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 13, fontStyle: "italic" }}>No hay comparaciones en esta sesión aún.</p>
        ) : (
          history.map((h) => (
            <div key={h.id} style={{ marginBottom: 15, padding: 12, background: "#334155", borderRadius: 8, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)" }}>
              <b style={{ textTransform: "capitalize", color: "#38bdf8", display: "block", marginBottom: 4 }}>{h.country_a} vs {h.country_b}</b>
              <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: "1.4" }}>{h.summary}</p>
            </div>
          ))
        )}
      </div>

      {/* CHAT PRINCIPAL */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#0f172a" }}>
        <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {chat.map((m, i) => {
            const isUser = m.role === "user";
            let dynamicContent = m.content;
            
            if (!isUser && typeof m.content === "string") {
              try {
                if (m.content.trim().startsWith("{")) {
                  dynamicContent = JSON.parse(m.content);
                }
              } catch (e) {
                console.error("Error parseando contenido", e);
              }
            }

            const isComparisonObject = !isUser && dynamicContent && typeof dynamicContent === "object" && "summary" in dynamicContent;
            const isReportObject = !isUser && dynamicContent && typeof dynamicContent === "object" && "countryName" in dynamicContent;
            const isEmptyText = !isUser && typeof dynamicContent === "string" && !dynamicContent.trim();

            return (
              <div key={i} style={{ marginBottom: 20, alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "75%", width: "100%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                <span style={{ fontSize: 12, fontWeight: "bold", marginBottom: 4, color: isUser ? "#38bdf8" : "#94a3b8" }}>
                  {isUser ? "Tú" : "Agente IA"}:
                </span>
                <div style={{ background: isUser ? "#0070f3" : "#f1f5f9", color: isUser ? "#ffffff" : "#0f172a", padding: "14px 18px", borderRadius: isUser ? "16px 16px 0px 16px" : "16px 16px 16px 0px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)", width: "fit-content", fontSize: 14, lineHeight: "1.5", minWidth: "50px" }}>
                  
                  {/* Vista de Usuario */}
                  {isUser && <div style={{ whiteSpace: "pre-wrap" }}>{dynamicContent}</div>}

                  {/* Vista de Comparación Estructurada */}
                  {isComparisonObject && (
                    <div>
                      <p style={{ margin: "0 0 5px 0", fontWeight: "bold", color: "#1e3a8a" }}>📊 Resumen Comparativo:</p>
                      <p style={{ margin: "0 0 15px 0" }}>{dynamicContent.summary}</p>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "bold", color: "#065f46" }}>🏠 Calidad de Vida:</p>
                      <p style={{ margin: "0 0 15px 0" }}>{dynamicContent.livingRecommendation}</p>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "bold", color: "#9a3412" }}>✈️ Opciones Turísticas:</p>
                      <p style={{ margin: 0 }}>{dynamicContent.tourismRecommendation}</p>
                    </div>
                  )}

                  {/* Vista de Reporte de País Único Estructurado*/}
                  {isReportObject && (
                    <div>
                      <h4 style={{ margin: "0 0 10px 0", color: "#0284c7", fontSize: 16, borderBottom: "2px solid #e2e8f0", paddingBottom: 4 }}>
                        🌍 Reporte Oficial: {dynamicContent.countryName}
                      </h4>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "bold", color: "#1e3a8a" }}>👥 Demografía y Población:</p>
                      <p style={{ margin: "0 0 15px 0" }}>{dynamicContent.demographics}</p>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "bold", color: "#0d9488" }}>🗣️ Idiomas y Cultura:</p>
                      <p style={{ margin: "0 0 15px 0" }}>{dynamicContent.languagesAndCulture}</p>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "bold", color: "#b45309" }}>📈 Análisis Económico:</p>
                      <p style={{ margin: 0 }}>{dynamicContent.economyAndInsight}</p>
                    </div>
                  )}

                  {/* Fallback de error si falla algo */}
                  {isEmptyText && <span style={{ color: "#ef4444", fontStyle: "italic" }}>Error: No se pudo estructurar el reporte.</span>}
                  {!isUser && !isComparisonObject && !isReportObject && !isEmptyText && (
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {typeof dynamicContent === "string" ? dynamicContent : JSON.stringify(dynamicContent, null, 2)}
                    </div>
                  )}

                  {/* Sistema de Feedback Thumbs Up/Down */}
                  {!isUser && !isEmptyText && (
                    <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, fontSize: 12, color: "#64748b" }}>
                      <span>{votedMessages[i] ? votedMessages[i] : "¿Te sirvió?"}</span>
                      {!votedMessages[i] && (
                        <>
                          <button onClick={() => handleFeedback(i, "thumbs_up")} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, padding: "2px 4px" }} title="Es útil">👍</button>
                          <button onClick={() => handleFeedback(i, "thumbs_down")} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, padding: "2px 4px" }} title="No me sirvió">👎</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <p style={{ color: "#38bdf8", fontStyle: "italic", fontWeight: "600", alignSelf: "flex-start" }}>
              🤖 El agente está pensando y consultando APIs...
            </p>
          )}
        </div>

        {/* INPUT DE CHAT */}
        <div style={{ display: "flex", padding: 15, borderTop: "1px solid #1e293b", backgroundColor: "#0f172a" }}>
          <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Ej: Compara Francia con Italia o dame el reporte de Japón" style={{ flex: 1, padding: 14, borderRadius: 8, border: "1px solid #334155", fontSize: 14, backgroundColor: "#1e293b", color: "#ffffff" }} />
          <button onClick={sendMessage} style={{ marginLeft: 10, padding: "0 24px", borderRadius: 8, background: "#0070f3", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>Enviar</button>
        </div>
      </div>

      {/* PANEL DE OBSERVABILIDAD */}
      <div style={{ width: "25%", borderLeft: "1px solid #1e293b", padding: 15, backgroundColor: "#1e293b", overflowY: "auto" }}>
        <h3 style={{ marginTop: 0, color: "#ffffff" }}>🛠️ Inspector de Tools </h3>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 15 }}>Invocaciones y payloads ejecutados en tiempo real:</p>
        
        {lastToolsExecuted.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", border: "2px dashed #334155", color: "#94a3b8", borderRadius: 8, marginTop: 20, backgroundColor: "#0f172a" }}>
            Ninguna herramienta ejecutada en el último turno.
          </div>
        ) : (
          lastToolsExecuted.map((t, idx) => (
            <div key={idx} style={{ background: "#0f172a", padding: 12, marginBottom: 12, borderRadius: 8, border: "1px solid #334155" }}>
              <span style={{ fontSize: 10, background: "#0c4a6e", color: "#38bdf8", padding: "3px 8px", borderRadius: 4, fontWeight: "bold", display: "inline-block", marginBottom: 6 }}>FUNCTION CALL</span>
              <h4 style={{ margin: "0 0 8px 0", color: "#ffffff", fontSize: 14 }}>{t.tool}</h4>
              <p style={{ margin: "5px 0 2px 0", fontSize: 11, fontWeight: "bold", color: "#94a3b8" }}>📥 Arguments:</p>
              <pre style={{ fontSize: 11, background: "#1e293b", color: "#e2e8f0", padding: 8, borderRadius: 6, overflowX: "auto", margin: 0, border: "1px solid #334155" }}>{JSON.stringify(t.input, null, 2)}</pre>
              <p style={{ margin: "10px 0 2px 0", fontSize: 11, fontWeight: "bold", color: "#94a3b8" }}>📤 API Response:</p>
              <pre style={{ fontSize: 11, background: "#064e3b", color: "#6ee7b7", padding: 8, borderRadius: 6, overflowX: "auto", margin: 0, border: "1px solid #047857" }}>{JSON.stringify(t.output, null, 2)}</pre>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
