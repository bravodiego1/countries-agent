export default function ToolsInspector({ tools }) {
  return (
      <div style={{ width: "25%", borderLeft: "1px solid #1e293b", padding: 15, backgroundColor: "#1e293b", overflowY: "auto" }}>
        <h3 style={{ marginTop: 0, color: "#ffffff" }}>🛠️ Inspector de Tools </h3>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 15 }}>Invocaciones y payloads ejecutados en tiempo real:</p>
        
        {tools.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", border: "2px dashed #334155", color: "#94a3b8", borderRadius: 8, marginTop: 20, backgroundColor: "#0f172a" }}>
            Ninguna herramienta ejecutada en el último turno.
          </div>
        ) : (
          tools.map((t, idx) => (
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
  );
}