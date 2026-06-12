export default function ChatInput({ message, setMessage, onSend }) {
  return (
    <div style={{ display: "flex", padding: 15, borderTop: "1px solid #1e293b", backgroundColor: "#0f172a" }}>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
        onKeyDown={(e) => e.key === "Enter" && onSend()} 
        placeholder="Ej: Compara Francia con Italia..., Dame un reporte de Japón..." 
        style={{ flex: 1, padding: 14, borderRadius: 8, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#ffffff" }} 
      />
      <button onClick={onSend} style={{ marginLeft: 10, padding: "0 24px", borderRadius: 8, background: "#0070f3", color: "#fff", border: "none" }}>Enviar</button>
    </div>
  );
}