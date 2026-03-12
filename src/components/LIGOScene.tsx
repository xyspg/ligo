import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Grid } from "@react-three/drei";
import * as THREE from "three";

const BEAM_COLOR = "#00ff88";
const BEAM_EMISSIVE = new THREE.Color(BEAM_COLOR);
const PHOTON_COUNT = 7;
const PHOTON_RADIUS = 0.08;
const ARM_LENGTH = 8;
const LASER_POS_X = -6;
const DETECTOR_POS_Z = 3;
const OSCILLATION_AMP = 0.5;
const WAVE_SPEED = 2;

// Photon path segments for each beam
// Beam 1: Laser -> splitter -> X mirror -> splitter -> detector
// Beam 2: Laser -> splitter -> Z mirror -> splitter -> detector

interface Props {
  waveOn: boolean;
  onSignalUpdate: (value: number) => void;
}

function LaserSource() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(clock.elapsedTime * 8) * 0.3;
    }
  });
  return (
    <group position={[LASER_POS_X, 0, 0]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.8, 0.5, 0.5]} />
        <meshStandardMaterial
          color="#aaff44"
          emissive="#aaff44"
          emissiveIntensity={0.5}
        />
      </mesh>
      <Text
        position={[0, 0.7, 0]}
        fontSize={0.35}
        color="white"
        anchorX="center"
      >
        Laser
      </Text>
    </group>
  );
}

function BeamSplitter() {
  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.7, 0.5, 0.7]} />
        <meshStandardMaterial
          color="#88ccff"
          transparent
          opacity={0.35}
          emissive="#88ccff"
          emissiveIntensity={0.2}
        />
      </mesh>
      <Text
        position={[0, 0.7, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
      >
        Beam Splitter
      </Text>
    </group>
  );
}

function EndMirror({
  position,
  rotation,
  label,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  label?: string;
}) {
  return (
    <group position={position}>
      <mesh rotation={rotation}>
        <boxGeometry args={[0.15, 0.8, 1.2]} />
        <meshStandardMaterial
          color="#cccccc"
          metalness={0.9}
          roughness={0.1}
          emissive="#446688"
          emissiveIntensity={0.1}
        />
      </mesh>
      <Text
        position={[0, 0.9, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
      >
        {label || "End Mirror"}
      </Text>
    </group>
  );
}

function ArmLabel({
  from,
  to,
  label,
}: {
  from: [number, number, number];
  to: [number, number, number];
  label: string;
}) {
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    0.6,
    (from[2] + to[2]) / 2,
  ];
  return (
    <Text position={mid} fontSize={0.25} color="rgba(255,255,255,0.5)" anchorX="center">
      {label}
    </Text>
  );
}

// A set of photon particles traveling along a path of waypoints
function PhotonStream({ path, speed }: { path: THREE.Vector3[]; speed: number }) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Compute total path length and cumulative distances
  const { totalLen, cumLens } = useMemo(() => {
    const cumLens = [0];
    let total = 0;
    for (let i = 1; i < path.length; i++) {
      total += path[i].distanceTo(path[i - 1]);
      cumLens.push(total);
    }
    return { totalLen: total, cumLens };
  }, [path]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < PHOTON_COUNT; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      // Each photon is offset evenly along the path
      const phase = ((t * speed + (i / PHOTON_COUNT) * totalLen) % totalLen + totalLen) % totalLen;
      // Find which segment
      let segIdx = 0;
      for (let s = 1; s < cumLens.length; s++) {
        if (cumLens[s] >= phase) {
          segIdx = s - 1;
          break;
        }
      }
      const segStart = cumLens[segIdx];
      const segEnd = cumLens[segIdx + 1];
      const frac = (phase - segStart) / (segEnd - segStart);
      mesh.position.lerpVectors(path[segIdx], path[segIdx + 1], frac);
    }
  });

  return (
    <>
      {Array.from({ length: PHOTON_COUNT }).map((_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el; }}>
          <sphereGeometry args={[PHOTON_RADIUS, 8, 8]} />
          <meshStandardMaterial
            color={BEAM_COLOR}
            emissive={BEAM_COLOR}
            emissiveIntensity={3}
          />
        </mesh>
      ))}
    </>
  );
}

function SpacetimeRipple({ waveOn }: { waveOn: boolean }) {
  const ringsRef = useRef<(THREE.Mesh | null)[]>([]);
  const RING_COUNT = 5;

  useFrame(({ clock }) => {
    if (!waveOn) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < RING_COUNT; i++) {
      const mesh = ringsRef.current[i];
      if (!mesh) continue;
      const phase = ((t * 0.5 + i / RING_COUNT) % 1);
      const scale = 1 + phase * 12;
      mesh.scale.set(scale, scale, 1);
      (mesh.material as THREE.MeshStandardMaterial).opacity = (1 - phase) * 0.12;
    }
  });

  if (!waveOn) return null;

  return (
    <group position={[-8, 0.02, -8]} rotation={[-Math.PI / 2, 0, 0]}>
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <mesh key={i} ref={(el) => { ringsRef.current[i] = el; }}>
          <ringGeometry args={[0.9, 1, 64]} />
          <meshStandardMaterial
            color="#6644ff"
            emissive="#6644ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function InterferenceLabel({ waveOn }: { waveOn: boolean }) {
  return (
    <Text
      position={[0, -0.5, DETECTOR_POS_Z + 1.2]}
      fontSize={0.2}
      color={waveOn ? "#ff8844" : "#666666"}
      anchorX="center"
      maxWidth={6}
    >
      {waveOn
        ? "Arms unequal → interference pattern changes → signal detected!"
        : "Destructive interference — no signal."}
    </Text>
  );
}

export function LIGOScene({ waveOn, onSignalUpdate }: Props) {
  // Animated mirror positions
  const xMirrorX = useRef(ARM_LENGTH);
  const zMirrorZ = useRef(-ARM_LENGTH);
  const detectorIntensity = useRef(0);

  // We need to store path vectors that update each frame
  const splitter = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const laserPos = useMemo(() => new THREE.Vector3(LASER_POS_X, 0, 0), []);
  const detectorPos = useMemo(
    () => new THREE.Vector3(0, 0, DETECTOR_POS_Z),
    []
  );

  // Mutable vectors for animated endpoints
  const xMirrorPos = useRef(new THREE.Vector3(ARM_LENGTH, 0, 0));
  const zMirrorPos = useRef(new THREE.Vector3(0, 0, -ARM_LENGTH));

  // Beam path refs (updated in useFrame)
  const beamXPath = useRef<THREE.Vector3[]>([
    laserPos.clone(),
    splitter.clone(),
    new THREE.Vector3(ARM_LENGTH, 0, 0),
    splitter.clone(),
    detectorPos.clone(),
  ]);
  const beamZPath = useRef<THREE.Vector3[]>([
    laserPos.clone(),
    splitter.clone(),
    new THREE.Vector3(0, 0, -ARM_LENGTH),
    splitter.clone(),
    detectorPos.clone(),
  ]);

  // Refs for beam segment meshes
  const xMirrorGroupRef = useRef<THREE.Group>(null);
  const zMirrorGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (waveOn) {
      const osc = Math.sin(t * WAVE_SPEED);
      xMirrorX.current = ARM_LENGTH + osc * OSCILLATION_AMP;
      zMirrorZ.current = -(ARM_LENGTH - osc * OSCILLATION_AMP);
      detectorIntensity.current = Math.abs(osc) * 1.5;
    } else {
      xMirrorX.current = ARM_LENGTH;
      zMirrorZ.current = -ARM_LENGTH;
      detectorIntensity.current = 0;
    }

    onSignalUpdate(waveOn ? Math.sin(t * WAVE_SPEED) : 0);

    // Update mirror group positions
    if (xMirrorGroupRef.current) {
      xMirrorGroupRef.current.position.x = xMirrorX.current;
    }
    if (zMirrorGroupRef.current) {
      zMirrorGroupRef.current.position.z = zMirrorZ.current;
    }

    // Update beam paths
    xMirrorPos.current.set(xMirrorX.current, 0, 0);
    zMirrorPos.current.set(0, 0, zMirrorZ.current);

    beamXPath.current[2].copy(xMirrorPos.current);
    beamZPath.current[2].copy(zMirrorPos.current);
  });

  return (
    <>
      {/* Floor grid */}
      <Grid
        args={[30, 30]}
        position={[0, -0.5, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1a1a3a"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2a2a4a"
        fadeDistance={25}
        infiniteGrid
      />

      {/* Components */}
      <LaserSource />
      <BeamSplitter />
      <group ref={xMirrorGroupRef} position={[ARM_LENGTH, 0, 0]}>
        <EndMirror position={[0, 0, 0]} label="End Mirror" />
      </group>
      <group ref={zMirrorGroupRef} position={[0, 0, -ARM_LENGTH]}>
        <EndMirror
          position={[0, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          label="End Mirror"
        />
      </group>
      <PhotodetectorAnimated waveOn={waveOn} />

      {/* Arm labels */}
      <ArmLabel from={[0, 0, 0]} to={[ARM_LENGTH, 0, 0]} label="4 km arm" />
      <ArmLabel from={[0, 0, 0]} to={[0, 0, -ARM_LENGTH]} label="4 km arm" />

      {/* Beam segments — these are rendered as animated components */}
      <AnimatedBeams
        xMirrorX={xMirrorX}
        zMirrorZ={zMirrorZ}
      />

      {/* Photon streams */}
      <PhotonStream path={beamXPath.current} speed={3} />
      <PhotonStream path={beamZPath.current} speed={3} />

      {/* Spacetime ripple */}
      <SpacetimeRipple waveOn={waveOn} />

      {/* Interference label */}
      <InterferenceLabel waveOn={waveOn} />
    </>
  );
}

// Animated beam segments that follow mirror positions
function AnimatedBeams({
  xMirrorX,
  zMirrorZ,
}: {
  xMirrorX: React.RefObject<number>;
  zMirrorZ: React.RefObject<number>;
}) {
  // We create cylinder meshes and update them each frame
  const laserToSplitter = useRef<THREE.Group>(null);
  const splitterToXMirror = useRef<THREE.Group>(null);
  const xMirrorToSplitter = useRef<THREE.Group>(null);
  const splitterToZMirror = useRef<THREE.Group>(null);
  const zMirrorToSplitter = useRef<THREE.Group>(null);
  const splitterToDetector = useRef<THREE.Group>(null);

  const beamMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BEAM_COLOR,
        emissive: BEAM_EMISSIVE,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.6,
      }),
    []
  );

  const updateBeamCylinder = (
    group: THREE.Group,
    from: THREE.Vector3,
    to: THREE.Vector3
  ) => {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    group.position.copy(mid);
    group.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize()
    );
    // Scale y to match length
    const mesh = group.children[0] as THREE.Mesh;
    if (mesh) mesh.scale.set(1, len, 1);
  };

  const fromVec = useMemo(() => new THREE.Vector3(), []);
  const toVec = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const xEnd = xMirrorX.current;
    const zEnd = zMirrorZ.current;

    // Laser to splitter
    if (laserToSplitter.current) {
      fromVec.set(LASER_POS_X, 0, 0);
      toVec.set(0, 0, 0);
      updateBeamCylinder(laserToSplitter.current, fromVec, toVec);
    }
    // Splitter to X mirror (outgoing)
    if (splitterToXMirror.current) {
      fromVec.set(0, 0, 0);
      toVec.set(xEnd, 0, 0);
      updateBeamCylinder(splitterToXMirror.current, fromVec, toVec);
    }
    // X mirror to splitter (returning - same visual line)
    if (xMirrorToSplitter.current) {
      xMirrorToSplitter.current.visible = false; // same line, skip
    }
    // Splitter to Z mirror
    if (splitterToZMirror.current) {
      fromVec.set(0, 0, 0);
      toVec.set(0, 0, zEnd);
      updateBeamCylinder(splitterToZMirror.current, fromVec, toVec);
    }
    if (zMirrorToSplitter.current) {
      zMirrorToSplitter.current.visible = false;
    }
    // Splitter to detector
    if (splitterToDetector.current) {
      fromVec.set(0, 0, 0);
      toVec.set(0, 0, DETECTOR_POS_Z);
      updateBeamCylinder(splitterToDetector.current, fromVec, toVec);
    }
  });

  const cyl = <cylinderGeometry args={[0.02, 0.02, 1, 4]} />;

  return (
    <>
      {[
        laserToSplitter,
        splitterToXMirror,
        xMirrorToSplitter,
        splitterToZMirror,
        zMirrorToSplitter,
        splitterToDetector,
      ].map((ref, i) => (
        <group key={i} ref={ref}>
          <mesh material={beamMaterial}>{cyl}</mesh>
        </group>
      ))}
    </>
  );
}

function PhotodetectorAnimated({ waveOn }: { waveOn: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (waveOn) {
      const osc = Math.abs(Math.sin(clock.elapsedTime * WAVE_SPEED));
      mat.emissiveIntensity = osc * 1.5;
      mat.color.setStyle(osc > 0.3 ? "#ff8844" : "#553322");
      mat.emissive.setStyle(osc > 0.3 ? "#ff4400" : "#221100");
    } else {
      mat.emissiveIntensity = 0;
      mat.color.setStyle("#333333");
      mat.emissive.setStyle("#111111");
    }
  });

  return (
    <group position={[0, 0, DETECTOR_POS_Z]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.6, 0.4, 0.6]} />
        <meshStandardMaterial color="#333333" emissive="#111111" />
      </mesh>
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
      >
        Photodetector
      </Text>
    </group>
  );
}
