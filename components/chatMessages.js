"use client";

import { useEffect, useRef } from "react";

export default function ChatMessages({ chat, loading, votedMessages, onFeedback }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "#0f172a" }}>
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
            <div
              key={i}
              style={{
                marginBottom: 20,
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: "75%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: "bold", marginBottom: 4, color: isUser ? "#38bdf8" : "#94a3b8" }}>
                {isUser ? "Tú" : "Agente IA"}:
              </span>
              <div
                style={{
                  background: isUser ? "#0070f3" : "#f1f5f9",
                  color: isUser ? "#ffffff" : "#0f172a",
                  padding: "14px 18px",
                  borderRadius: isUser ? "16px 16px 0px 16px" : "16px 16px 16px 0px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)",
                  width: "fit-content",
                  fontSize: 14,
                  lineHeight: "1.5",
                  minWidth: "50px",
                }}
              >
                {isUser && <div style={{ whiteSpace: "pre-wrap" }}>{dynamicContent}</div>}

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

                {isEmptyText && (
                  <span style={{ color: "#ef4444", fontStyle: "italic" }}>Error: No se pudo estructurar el reporte.</span>
                )}

                {!isUser && !isComparisonObject && !isReportObject && !isEmptyText && (
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {typeof dynamicContent === "string" ? dynamicContent : JSON.stringify(dynamicContent, null, 2)}
                  </div>
                )}

                {!isUser && !isEmptyText && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 8,
                      borderTop: "1px solid #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 8,
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    <span>{votedMessages[i] ? votedMessages[i] : "¿Te sirvió?"}</span>
                    {!votedMessages[i] && (
                      <>
                        <button onClick={() => onFeedback(i, "thumbs_up")} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, padding: "2px 4px" }} title="Es útil">👍</button>
                        <button onClick={() => onFeedback(i, "thumbs_down")} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 13, padding: "2px 4px" }} title="No me sirvió">👎</button>
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

        <div ref={bottomRef} />
      </div>
    </div>
  );
}