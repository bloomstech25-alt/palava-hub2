const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function PalavaHubFlyer() {
  return (
    <div style={{
      width: 540,
      height: 960,
      background: "linear-gradient(160deg, #0a0a0a 0%, #1a0505 40%, #2d0808 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>

      {/* Background glow effects */}
      <div style={{
        position: "absolute", top: -80, left: -80, width: 320, height: 320,
        background: "radial-gradient(circle, rgba(178,34,34,0.35) 0%, transparent 70%)",
        borderRadius: "50%",
      }} />
      <div style={{
        position: "absolute", bottom: 80, right: -60, width: 280, height: 280,
        background: "radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)",
        borderRadius: "50%",
      }} />

      {/* Top strip — Liberian flag colors */}
      <div style={{
        width: "100%", height: 5,
        background: "linear-gradient(90deg, #B22234 0%, #B22234 50%, #003F87 50%, #003F87 100%)",
        flexShrink: 0,
      }} />

      {/* Header */}
      <div style={{ width: "100%", padding: "28px 36px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <p style={{
          fontSize: 13, letterSpacing: 4, textTransform: "uppercase",
          color: "#D4AF37", fontWeight: 600, margin: 0, opacity: 0.9,
        }}>
          Blooms Technologies Presents
        </p>

        {/* Logo + name row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 18 }}>
          <img
            src={`${BASE}/app-icon.png`}
            alt="Palava Hub Logo"
            style={{ width: 64, height: 64, borderRadius: 16 }}
          />
          <div>
            <h1 style={{
              fontSize: 44, fontWeight: 900, margin: 0, lineHeight: 1,
              background: "linear-gradient(135deg, #ffffff 0%, #D4AF37 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              letterSpacing: -1,
            }}>
              PALAVA HUB
            </h1>
            <p style={{ fontSize: 13, color: "#D4AF37", margin: "4px 0 0", letterSpacing: 2, textTransform: "uppercase" }}>
              🇱🇷 Liberia's Own Social Media
            </p>
          </div>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 15, color: "rgba(255,255,255,0.75)", textAlign: "center",
          margin: "14px 0 0", lineHeight: 1.5, maxWidth: 380,
        }}>
          Where Liberian students <span style={{ color: "#D4AF37", fontWeight: 700 }}>connect</span>,{" "}
          <span style={{ color: "#D4AF37", fontWeight: 700 }}>share</span> &{" "}
          <span style={{ color: "#D4AF37", fontWeight: 700 }}>grow</span> together
        </p>
      </div>

      {/* Phone mockup with actual app screenshot */}
      <div style={{
        position: "relative", marginTop: 24, flexShrink: 0,
        filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.7))",
      }}>
        {/* Phone frame */}
        <div style={{
          width: 220, height: 440,
          background: "#111",
          borderRadius: 36,
          border: "3px solid #333",
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 0 0 1px #555, inset 0 0 0 1px #222",
        }}>
          {/* Notch */}
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: 80, height: 22, background: "#111", borderRadius: "0 0 16px 16px",
            zIndex: 10,
          }} />
          {/* App screenshot */}
          <img
            src={`${BASE}/app-screen.jpg`}
            alt="Palava Hub App"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        </div>
        {/* Phone side button highlights */}
        <div style={{
          position: "absolute", right: -4, top: 80, width: 3, height: 40,
          background: "#444", borderRadius: 2,
        }} />
        <div style={{
          position: "absolute", left: -4, top: 70, width: 3, height: 28,
          background: "#444", borderRadius: 2,
        }} />
        <div style={{
          position: "absolute", left: -4, top: 108, width: 3, height: 28,
          background: "#444", borderRadius: 2,
        }} />
      </div>

      {/* Feature pills */}
      <div style={{
        display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap", justifyContent: "center",
        padding: "0 32px",
      }}>
        {["🎓 Campus Connect", "🔥 Trending Feed", "💬 Live Chat", "📡 Go Live"].map((f) => (
          <span key={f} style={{
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 100, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)", whiteSpace: "nowrap",
          }}>
            {f}
          </span>
        ))}
      </div>

      {/* Launch announcement banner */}
      <div style={{
        marginTop: 28,
        background: "linear-gradient(135deg, #B22234, #8B0000)",
        borderRadius: 20,
        padding: "20px 36px",
        textAlign: "center",
        width: "calc(100% - 64px)",
        border: "1px solid rgba(212,175,55,0.3)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: -20, right: -20, width: 80, height: 80,
          background: "radial-gradient(circle, rgba(212,175,55,0.25) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />
        <p style={{ margin: 0, fontSize: 11, letterSpacing: 4, color: "#D4AF37", textTransform: "uppercase", fontWeight: 600 }}>
          Official Launch
        </p>
        <p style={{
          margin: "6px 0 0", fontSize: 32, fontWeight: 900, letterSpacing: -1,
          color: "#fff",
        }}>
          May 4th, 2026
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
          Join the movement. Be part of history.
        </p>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "auto", padding: "16px 36px 22px",
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          A Blooms Technologies Product
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(212,175,55,0.6)", fontWeight: 600 }}>
          palavahub.app
        </p>
      </div>

      {/* Bottom Liberian flag strip */}
      <div style={{
        width: "100%", height: 5, flexShrink: 0,
        background: "linear-gradient(90deg, #B22234 0%, #B22234 50%, #003F87 50%, #003F87 100%)",
      }} />
    </div>
  );
}
