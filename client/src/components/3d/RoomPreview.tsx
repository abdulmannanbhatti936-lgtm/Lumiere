import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export interface RoomPreviewProps {
  roomName: string;
  capacity: number;
  hotelCategory?: string;
  /** This room's price relative to the cheapest/priciest room at the same hotel, 0..1. */
  priceTier?: number;
}

interface PaletteSet {
  wall: string;
  wallAccent: string;
  floor: string;
  wood: string;
  linen: string;
  accent: string;
  sky: [string, string];
}

const PALETTES: Record<string, PaletteSet> = {
  beach: {
    wall: '#F6EFE1',
    wallAccent: '#EDE1C9',
    floor: '#D9C9A8',
    wood: '#C9A876',
    linen: '#FBF7EE',
    accent: '#E8724C',
    sky: ['#BFE3E8', '#F3E3C6'],
  },
  mountain: {
    wall: '#EFE9DC',
    wallAccent: '#DED0B8',
    floor: '#7C5C3E',
    wood: '#5A4530',
    linen: '#F1E9DA',
    accent: '#B4632B',
    sky: ['#8FAFC7', '#E9D9BE'],
  },
  city: {
    wall: '#F1EDE3',
    wallAccent: '#E2DACB',
    floor: '#3A3F52',
    wood: '#2B3A67',
    linen: '#F7F4EC',
    accent: '#2B3A67',
    sky: ['#33456E', '#8C6E4E'],
  },
  boutique: {
    wall: '#F3EAE3',
    wallAccent: '#E7D3C3',
    floor: '#4A2E2A',
    wood: '#6B3F2E',
    linen: '#F6E9DE',
    accent: '#A3503F',
    sky: ['#5B3A52', '#D98A5E'],
  },
};

const PLANT_GREEN = '#5C6E4C';
const PLANT_GREEN_DARK = '#3E4B33';

function getPalette(hotelCategory?: string): PaletteSet {
  return PALETTES[hotelCategory ?? ''] ?? PALETTES.city;
}

/** 0 = smallest/cheapest room at this hotel, 3 = largest/priciest. */
function tierFromNorm(norm: number) {
  if (norm >= 0.75) return 3;
  if (norm >= 0.5) return 2;
  if (norm >= 0.25) return 1;
  return 0;
}

/** Small deterministic hash so the same room always renders the same layout. */
function seedFromName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

function Bed({ palette, wide }: { palette: PaletteSet; wide: boolean }) {
  const width = wide ? 2.6 : 1.7;
  return (
    <group position={[0, -0.62, 0.1]}>
      <RoundedBox args={[width, 0.35, 2]} radius={0.06} position={[0, -0.18, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.6} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[width - 0.06, 0.22, 1.94]} radius={0.08} position={[0, 0.06, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={palette.linen} roughness={0.85} />
      </RoundedBox>
      <RoundedBox
        args={[width - 0.06, 0.18, 0.55]}
        radius={0.06}
        position={[0, 0.24, -0.68]}
        castShadow
      >
        <meshStandardMaterial color={palette.accent} roughness={0.8} />
      </RoundedBox>
      {[wide ? -0.55 : 0, wide ? 0.55 : null]
        .filter((x): x is number => x !== null)
        .map((x, i) => (
          <RoundedBox key={i} args={[0.5, 0.16, 0.36]} radius={0.07} position={[x, 0.3, -0.78]} castShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
          </RoundedBox>
        ))}
      <RoundedBox args={[width + 0.08, 0.7, 0.08]} radius={0.05} position={[0, 0.35, -1.0]} castShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.55} />
      </RoundedBox>
    </group>
  );
}

function Nightstand({ palette, x, warmShade }: { palette: PaletteSet; x: number; warmShade: boolean }) {
  return (
    <group position={[x, -0.72, -0.35]}>
      <RoundedBox args={[0.42, 0.5, 0.4]} radius={0.04} castShadow receiveShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.05, 0.28, 12]} />
        <meshStandardMaterial color="#8A8370" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <coneGeometry args={[0.16, 0.24, 16, 1, true]} />
        <meshStandardMaterial
          color={warmShade ? '#FBF3E4' : '#EDE7DC'}
          emissive={warmShade ? '#F4C98B' : palette.accent}
          emissiveIntensity={warmShade ? 0.9 : 0.5}
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Wardrobe({ palette, mirrored }: { palette: PaletteSet; mirrored: boolean }) {
  const x = mirrored ? 1.75 : -1.75;
  const handleX = mirrored ? -0.4 : 0.4;
  return (
    <group position={[x, -0.35, -1.55]}>
      <RoundedBox args={[0.9, 1.5, 0.5]} radius={0.03} castShadow receiveShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.55} />
      </RoundedBox>
      <mesh position={[0.02, 0, 0.26]}>
        <boxGeometry args={[0.01, 1.4, 0.02]} />
        <meshStandardMaterial color="#12141F" />
      </mesh>
      {[-0.05, 0.15].map((y, i) => (
        <mesh key={i} position={[handleX, y, 0.27]} castShadow>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#C9B98C" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function SeatingArea({ palette, grand }: { palette: PaletteSet; grand: boolean }) {
  const scale = grand ? 1.15 : 0.9;
  return (
    <group position={[1.7 * scale, -0.78, -1.0 * scale]} rotation={[0, -0.5, 0]} scale={scale}>
      <RoundedBox args={[0.85, 0.5, 0.75]} radius={0.12} castShadow receiveShadow>
        <meshStandardMaterial color={palette.accent} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[0.85, 0.55, 0.14]} radius={0.1} position={[0, 0.42, -0.32]} castShadow>
        <meshStandardMaterial color={palette.accent} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[0.16, 0.16, 0.16]} radius={0.03} position={[0.15, 0.35, 0.1]} rotation={[0.2, 0.3, 0]} castShadow>
        <meshStandardMaterial color={palette.linen} roughness={0.9} />
      </RoundedBox>
    </group>
  );
}

function CoffeeTable({ palette, x, z }: { palette: PaletteSet; x: number; z: number }) {
  return (
    <group position={[x, -0.85, z]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.3, 0.08, 24]} />
        <meshStandardMaterial color={palette.wood} roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.32, 8]} />
        <meshStandardMaterial color="#2A2A2A" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Plant({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, -0.78, z]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.18, 0.4, 16]} />
        <meshStandardMaterial color="#8A7A5E" roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[Math.sin(i) * 0.08, 0.55 + i * 0.06, Math.cos(i) * 0.08]}
          rotation={[0.3, i * 1.2, 0]}
          castShadow
        >
          <coneGeometry args={[0.14, 0.55, 8]} />
          <meshStandardMaterial color={i % 2 === 0 ? PLANT_GREEN : PLANT_GREEN_DARK} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function LuggageBench({ palette }: { palette: PaletteSet }) {
  return (
    <RoundedBox args={[1.3, 0.28, 0.5]} radius={0.05} position={[0, -0.86, 1.15]} castShadow receiveShadow>
      <meshStandardMaterial color={palette.linen} roughness={0.85} />
    </RoundedBox>
  );
}

function PendantLight({ x }: { x: number }) {
  return (
    <group position={[x, 1.35, -0.2]}>
      <mesh>
        <cylinderGeometry args={[0.008, 0.008, 0.65, 6]} />
        <meshStandardMaterial color="#2A2A2A" />
      </mesh>
      <mesh position={[0, -0.38, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#FBF3E4" emissive="#F4C98B" emissiveIntensity={1.1} roughness={0.5} />
      </mesh>
      <pointLight position={[0, -0.4, 0]} intensity={0.35} color="#F4C98B" distance={2.2} />
    </group>
  );
}

function Rug({ palette, roundShape, radius }: { palette: PaletteSet; roundShape: boolean; radius: number }) {
  const y = -0.99;
  if (roundShape) {
    return (
      <mesh position={[0, y, 0.35]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color={palette.wallAccent} roughness={1} />
      </mesh>
    );
  }
  return (
    <RoundedBox args={[radius * 1.7, 0.02, radius * 1.2]} radius={0.08} position={[0, y, 0.35]} receiveShadow>
      <meshStandardMaterial color={palette.wallAccent} roughness={1} />
    </RoundedBox>
  );
}

function WallArt({ palette, x, z, ry }: { palette: PaletteSet; x: number; z: number; ry: number }) {
  return (
    <group position={[x, 0.55, z]} rotation={[0, ry, 0]}>
      <RoundedBox args={[0.62, 0.44, 0.03]} radius={0.02} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.32, 0.02]} radius={0.01} position={[0, 0, 0.02]}>
        <meshStandardMaterial color={palette.accent} roughness={0.6} />
      </RoundedBox>
    </group>
  );
}

function Window({ palette, x }: { palette: PaletteSet; x: number }) {
  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, palette.sky[0]);
    gradient.addColorStop(1, palette.sky[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 4, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [palette]);

  return (
    <group position={[x, 0.35, -0.4]}>
      <mesh>
        <planeGeometry args={[1.3, 1.5]} />
        <meshBasicMaterial map={gradientTexture} toneMapped={false} />
      </mesh>
      {[-0.4, 0.4].map((wx) => (
        <mesh key={wx} position={[wx, 0, 0.01]}>
          <boxGeometry args={[0.04, 1.5, 0.04]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[1.3, 0.04, 0.04]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
      </mesh>
    </group>
  );
}

function RoomScene({ roomName, capacity, hotelCategory, priceTier = 0.5 }: RoomPreviewProps) {
  const groupRef = useRef<THREE.Group>(null);
  const palette = useMemo(() => getPalette(hotelCategory), [hotelCategory]);
  const seed = useMemo(() => seedFromName(roomName), [roomName]);
  const isSuite = /suite|deluxe|penthouse|villa|premier/i.test(roomName);
  const tier = tierFromNorm(priceTier);

  const wideBed = capacity >= 3 || isSuite || tier >= 2;
  const mirrored = seed % 3 === 0;
  const roundRug = seed % 2 === 0;
  const warmShade = seed % 2 === 0;
  const grandSeating = tier >= 3;

  const floorSize = 4.0 + tier * 0.65;
  const wallWidth = floorSize;
  const wallHeight = 3.0 + tier * 0.12;
  const wallX = floorSize / 2;
  // The side wall mesh only exists at -wallX (the +wallX side is left open for the
  // camera) — the window belongs on that open side regardless of mirroring, or it'd
  // render flush against the solid side wall instead of an opening.
  const windowX = wallX - 0.42;
  const rugRadius = 1.0 + tier * 0.12;

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={groupRef}>
      {/* Floor */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[floorSize, floorSize]} />
        <meshStandardMaterial color={palette.floor} roughness={0.55} metalness={0.08} />
      </mesh>
      <Rug palette={palette} roundShape={roundRug} radius={rugRadius} />

      {/* Back + side walls */}
      <mesh position={[0, wallHeight / 2 - 1, -floorSize / 2]} receiveShadow>
        <planeGeometry args={[wallWidth, wallHeight]} />
        <meshStandardMaterial color={palette.wall} roughness={0.95} />
      </mesh>
      <mesh position={[-wallX, wallHeight / 2 - 1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[floorSize, wallHeight]} />
        <meshStandardMaterial color={palette.wallAccent} roughness={0.95} />
      </mesh>

      <Bed palette={palette} wide={wideBed} />
      <Nightstand palette={palette} x={wideBed ? -1.55 : -1.05} warmShade={warmShade} />
      {(wideBed || tier >= 2) && <Nightstand palette={palette} x={1.55} warmShade={!warmShade} />}
      <Wardrobe palette={palette} mirrored={mirrored} />
      <Window palette={palette} x={windowX} />
      <WallArt palette={palette} x={mirrored ? 1.0 : -1.0} z={-floorSize / 2 + 0.02} ry={0} />
      {tier >= 1 && (
        <WallArt palette={palette} x={-wallX + 0.02} z={-0.6} ry={Math.PI / 2} />
      )}
      {(isSuite || tier >= 2) && <SeatingArea palette={palette} grand={grandSeating} />}
      {tier >= 2 && <Plant x={mirrored ? -wallX + 0.5 : wallX - 0.5} z={0.8} />}
      {tier >= 3 && <CoffeeTable palette={palette} x={1.7 * 1.15} z={-1.0 * 1.15 + 0.75} />}
      {tier >= 3 && <LuggageBench palette={palette} />}
      {tier >= 3 && <PendantLight x={0} />}

      <ContactShadows position={[0, -0.995, 0]} opacity={0.45} scale={floorSize + 1} blur={2.4} far={2} />
    </group>
  );
}

export default function RoomPreview({ roomName, capacity, hotelCategory, priceTier = 0.5 }: RoomPreviewProps) {
  const tier = tierFromNorm(priceTier);
  const camDist = 1 + tier * 0.22;

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [3.2 * camDist, 1.4 + tier * 0.08, 3.6 * camDist], fov: 42 }}
      className="w-full h-full"
      gl={{ antialias: true }}
    >
      <color attach="background" args={[getPalette(hotelCategory).sky[0]]} />
      <hemisphereLight args={[getPalette(hotelCategory).sky[0], '#403528', 0.65]} />
      <directionalLight
        position={[4, 5, 2]}
        intensity={1.4}
        color="#FFF3DE"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-1.05, -0.3, -0.1]} intensity={0.4} color="#F4C98B" distance={2} />

      <RoomScene roomName={roomName} capacity={capacity} hotelCategory={hotelCategory} priceTier={priceTier} />

      <OrbitControls
        autoRotate={false}
        enableZoom
        enablePan={false}
        minDistance={2.6 + tier * 0.3}
        maxDistance={6 + tier * 1.1}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, -0.3, 0]}
      />
    </Canvas>
  );
}
