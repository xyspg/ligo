import { useRef, useEffect, useCallback } from "react";

interface Props {
  signalRef: React.RefObject<number>;
}

export function SignalGraph({ signalRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<number[]>(new Array(120).fill(0));
  const frameRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = dataRef.current;
    data.push(signalRef.current);
    if (data.length > 120) data.shift();

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "rgba(10, 10, 26, 0.85)";
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Signal line
    ctx.strokeStyle = "#ff6622";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * w;
      const y = h / 2 - data[i] * (h / 2) * 0.8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Label
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "10px sans-serif";
    ctx.fillText("Signal Amplitude", 4, 12);

    frameRef.current = requestAnimationFrame(draw);
  }, [signalRef]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={80}
      style={{
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.1)",
        width: 280,
        height: 80,
      }}
    />
  );
}
