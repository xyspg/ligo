import { useRef, useEffect, useCallback } from "react";

interface DetectorDetailOverlayProps {
  waveOn: boolean;
  onClose: () => void;
}

interface WaveGraphProps {
  label: string;
  color: string;
  getY: (t: number) => number;
}

function WaveGraph({ label, color, getY }: WaveGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const getYRef = useRef(getY);
  getYRef.current = getY;

  const draw = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) startTimeRef.current = timestamp;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const elapsed = (timestamp - startTimeRef.current) / 1000;

    // Clear
    ctx.fillStyle = "rgba(10, 10, 26, 0.95)";
    ctx.fillRect(0, 0, w, h);

    // Center line
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Wave — draw from right to left scrolling
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const sampleCount = w;
    for (let i = 0; i < sampleCount; i++) {
      // t goes from (elapsed - viewWindow) to elapsed, mapped across the canvas
      const viewWindow = 4; // seconds visible
      const sampleT = elapsed - viewWindow * (1 - i / sampleCount);
      const val = getYRef.current(sampleT);
      const x = i;
      const y = h / 2 - val * (h / 2) * 0.75;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Label
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "11px 'Inter', sans-serif";
    ctx.fillText(label, 6, 14);

    frameRef.current = requestAnimationFrame(draw);
  }, [color, label]);

  useEffect(() => {
    startTimeRef.current = null;
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={80}
      style={{
        width: 560,
        height: 80,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    />
  );
}

export function DetectorDetailOverlay({ waveOn, onClose }: DetectorDetailOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "x" || e.key === "X") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Wave functions
  const waveFreq = 6;

  const getArmX = useCallback(
    (t: number) => Math.sin(t * waveFreq),
    []
  );

  const getArmZ = useCallback(
    (t: number) => {
      const phaseShift = waveOn ? 0.5 * Math.sin(t * 2) : 0;
      return Math.sin(t * waveFreq + Math.PI + phaseShift);
    },
    [waveOn]
  );

  const getCombined = useCallback(
    (t: number) => {
      const phaseShift = waveOn ? 0.5 * Math.sin(t * 2) : 0;
      return Math.sin(t * waveFreq) + Math.sin(t * waveFreq + Math.PI + phaseShift);
    },
    [waveOn]
  );

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        pointerEvents: "auto",
      }}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 600,
          background: "rgba(12, 12, 30, 0.95)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.1)",
          padding: 20,
          position: "relative",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6,
            color: "#aaa",
            fontSize: 14,
            width: 28,
            height: 28,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          X
        </button>

        <h2
          style={{
            color: "white",
            fontSize: 16,
            fontWeight: 600,
            marginBottom: 16,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Photodetector Detail View
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <WaveGraph
            label="Arm X — Returning Wave"
            color="#00ff88"
            getY={getArmX}
          />
          <WaveGraph
            label="Arm Z — Returning Wave"
            color="#00ccff"
            getY={getArmZ}
          />
          <WaveGraph
            label="Combined Signal (at Photodetector)"
            color="#ff6622"
            getY={getCombined}
          />
        </div>

        <p
          style={{
            color: waveOn ? "#ff8844" : "#666",
            fontSize: 12,
            marginTop: 12,
            fontFamily: "'Inter', sans-serif",
            textAlign: "center",
          }}
        >
          {waveOn
            ? "Arms unequal → incomplete cancellation → signal detected"
            : "Perfect cancellation — no signal"}
        </p>
      </div>
    </div>
  );
}
