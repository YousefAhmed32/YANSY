import { useState, useEffect } from "react";

const SwipeHint = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = () => setVisible(false);
    window.addEventListener("scroll", hide, { once: true });
    return () => window.removeEventListener("scroll", hide);
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes hintAppear {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes hintBreath {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        @keyframes fingerBounce {
          0%, 100% { transform: translateY(0); }
          40%      { transform: translateY(-4px); }
          70%      { transform: translateY(-2px); }
        }
        @keyframes scanMove {
          0%   { top: 0; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      <div style={{
        position: "fixed",
        bottom: "70px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
        animation: "hintAppear 1s cubic-bezier(0.16,1,0.3,1) 0.3s both, hintBreath 3s ease-in-out 1.4s infinite",
      }}>

        {/* خط فوق */}
        <div style={{
          width: "1px", height: "22px",
          background: "linear-gradient(to top, rgba(212,175,55,0.5), transparent)",
        }} />

        {/* الـ pill */}
        <div style={{
          position: "relative",
          padding: "8px 14px 8px 10px",
          border: "1px solid rgba(212,175,55,0.22)",
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          overflow: "hidden",
        }}>

          {/* scanning line */}
          <div style={{
            position: "absolute",
            left: 0, right: 0, height: "1px",
            background: "linear-gradient(to right, transparent, rgba(212,175,55,0.4), transparent)",
            animation: "scanMove 2.5s ease-in-out 1.4s infinite",
          }} />

          {/* أيقونة السهم */}
          <svg
            width="18" height="18" viewBox="0 0 20 20"
            fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0, animation: "fingerBounce 1.6s ease-in-out 1.4s infinite" }}
          >
            <path d="M10 14V8" stroke="#d4af37" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M7.5 10.5L10 8L12.5 10.5" stroke="#d4af37" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="5" y="11" width="10" height="7" rx="2" stroke="rgba(212,175,55,0.35)" strokeWidth="1"/>
            <circle cx="10" cy="14.5" r="1" fill="rgba(212,175,55,0.4)"/>
          </svg>

          {/* النصوص */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <span style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 200,
              fontSize: "8px", letterSpacing: "0.32em",
              textTransform: "uppercase", color: "rgba(212,175,55,0.55)",
              whiteSpace: "nowrap",
            }}>scroll up</span>
            <span style={{
              fontFamily: "'Montserrat', sans-serif", fontWeight: 300,
              fontSize: "9px", letterSpacing: "0.04em",
              color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap",
            }}>اسحب لأعلى</span>
          </div>
        </div>

        {/* خط تحت */}
        <div style={{
          width: "1px", height: "10px",
          background: "linear-gradient(to bottom, rgba(212,175,55,0.3), transparent)",
        }} />
      </div>
    </>
  );
};

export default SwipeHint;