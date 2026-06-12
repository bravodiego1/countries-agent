export default function SidebarHistory({ history }) {
  return (
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
  );
}