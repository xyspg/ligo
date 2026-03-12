import { useState, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { LIGOScene } from "./components/LIGOScene";
import { SignalGraph } from "./components/SignalGraph";
import { DetectorDetailOverlay } from "./components/DetectorDetailOverlay";

export default function App() {
  const [waveOn, setWaveOn] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const signalRef = useRef(0);

  const onSignalUpdate = useCallback((value: number) => {
    signalRef.current = value;
  }, []);

  const onDetectorClick = useCallback(() => {
    setDetailOpen(true);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [10, 12, 10], fov: 50 }}
        gl={{ antialias: true }}
        style={{ background: "#0a0a1a" }}
      >
        <ambientLight intensity={0.15} />
        <pointLight position={[0, 10, 0]} intensity={0.5} />
        <LIGOScene waveOn={waveOn} onSignalUpdate={onSignalUpdate} onDetectorClick={onDetectorClick} />
        <OrbitControls
          makeDefault
          target={[1, 0, -2]}
          maxPolarAngle={Math.PI / 2.1}
        />
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={1.5}
          />
        </EffectComposer>
      </Canvas>

      {/* UI Overlay */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          pointerEvents: "none",
          maxWidth: 340,
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          How LIGO Works
        </h1>
        <p
          style={{
            fontSize: 13,
            opacity: 0.7,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          {waveOn
            ? "Wave stretches one arm, compresses the other → signal detected"
            : "Both arms equal length → beams cancel → no signal"}
        </p>

        <button
          onClick={() => setWaveOn((v) => !v)}
          style={{
            pointerEvents: "auto",
            padding: "8px 20px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.2)",
            background: waveOn
              ? "rgba(0,255,136,0.15)"
              : "rgba(255,255,255,0.08)",
            color: waveOn ? "#00ff88" : "#aaa",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s",
            backdropFilter: "blur(8px)",
          }}
        >
          Gravitational Wave: {waveOn ? "ON" : "OFF"}
        </button>

        {waveOn && (
          <div style={{ marginTop: 16 }}>
            <SignalGraph signalRef={signalRef} />
          </div>
        )}
      </div>

      {/* Footnote */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 20,
          color: "rgba(255,255,255,0.3)",
          fontSize: 11,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        * Mirror oscillation exaggerated for visual clarity. Real displacement
        is ~10⁻¹⁸ m (1/1000th the width of a proton).
      </div>

      {/* Detector detail overlay */}
      {detailOpen && (
        <DetectorDetailOverlay
          waveOn={waveOn}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  );
}
