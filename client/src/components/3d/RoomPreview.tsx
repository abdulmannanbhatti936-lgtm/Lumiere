import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export interface RoomPreviewProps {
  roomName: string;
  hotelCategory?: string;
  /** This room's price relative to the cheapest/priciest room at the same hotel, 0..1. */
  priceTier?: number;
}

type RoomType = 'standard' | 'deluxe' | 'suite';

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
const TRIM = '#FFFFFF';

const FLOOR_SIZE: Record<RoomType, number> = { standard: 4.2, deluxe: 5.6, suite: 7.4 };
const WALL_HEIGHT: Record<RoomType, number> = { standard: 3.0, deluxe: 3.1, suite: 3.25 };

function getPalette(hotelCategory?: string): PaletteSet {
  return PALETTES[hotelCategory ?? ''] ?? PALETTES.city;
}

function roomTypeFromName(name: string): RoomType {
  if (/suite|penthouse|villa|premier/i.test(name)) return 'suite';
  if (/deluxe|superior|executive/i.test(name)) return 'deluxe';
  return 'standard';
}

/** Small deterministic hash so the same room always renders the same layout. */
function seedFromName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

function useSkyTexture(palette: PaletteSet) {
  return useMemo(() => {
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
}

// ---------- Shell (floor / walls / trim) ----------

function RoomShell({ palette, floorSize, wallHeight }: { palette: PaletteSet; floorSize: number; wallHeight: number }) {
  const wallX = floorSize / 2;
  const wallZ = floorSize / 2;
  return (
    <>
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[floorSize, floorSize]} />
        <meshStandardMaterial color={palette.floor} roughness={0.55} metalness={0.08} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, wallHeight / 2 - 1, -wallZ]} receiveShadow>
        <planeGeometry args={[floorSize, wallHeight]} />
        <meshStandardMaterial color={palette.wall} roughness={0.95} />
      </mesh>
      {/* Left wall (the +X side is deliberately left open for the camera) */}
      <mesh position={[-wallX, wallHeight / 2 - 1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[floorSize, wallHeight]} />
        <meshStandardMaterial color={palette.wallAccent} roughness={0.95} />
      </mesh>
      {/* Baseboard trim along both real walls */}
      <RoundedBox args={[floorSize - 0.02, 0.08, 0.03]} radius={0.01} position={[0, -0.96, -wallZ + 0.016]}>
        <meshStandardMaterial color={TRIM} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.03, 0.08, floorSize - 0.02]} radius={0.01} position={[-wallX + 0.016, -0.96, 0]}>
        <meshStandardMaterial color={TRIM} roughness={0.6} />
      </RoundedBox>
    </>
  );
}

// ---------- Shared furniture primitives ----------

function Bed({ palette, x, z, wide }: { palette: PaletteSet; x: number; z: number; wide: boolean }) {
  const width = wide ? 2.6 : 1.7;
  return (
    <group position={[x, -0.62, z]}>
      <RoundedBox args={[width, 0.35, 2]} radius={0.06} position={[0, -0.18, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.6} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[width - 0.06, 0.22, 1.94]} radius={0.08} position={[0, 0.06, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={palette.linen} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[width - 0.06, 0.18, 0.55]} radius={0.06} position={[0, 0.24, -0.68]} castShadow>
        <meshStandardMaterial color={palette.accent} roughness={0.8} />
      </RoundedBox>
      {[wide ? -0.55 : 0, wide ? 0.55 : null]
        .filter((n): n is number => n !== null)
        .map((px, i) => (
          <RoundedBox key={i} args={[0.5, 0.16, 0.36]} radius={0.07} position={[px, 0.3, -0.78]} castShadow>
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
          </RoundedBox>
        ))}
      <RoundedBox args={[width + 0.08, 0.7, 0.08]} radius={0.05} position={[0, 0.35, -1.0]} castShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.55} />
      </RoundedBox>
    </group>
  );
}

function Nightstand({ palette, x, z, warmShade }: { palette: PaletteSet; x: number; z: number; warmShade: boolean }) {
  return (
    <group position={[x, -0.72, z]}>
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

function Wardrobe({
  palette,
  x,
  z,
  mirrored,
  scale = 1,
}: {
  palette: PaletteSet;
  x: number;
  z: number;
  mirrored: boolean;
  scale?: number;
}) {
  const w = 0.9 * scale;
  const h = 1.5 * scale;
  const d = 0.5 * scale;
  const handleX = mirrored ? -0.16 * scale : 0.16 * scale;
  return (
    <group position={[x, -1 + h / 2, z]}>
      <RoundedBox args={[w, h, d]} radius={0.03 * scale} castShadow receiveShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.55} />
      </RoundedBox>
      <mesh position={[0.02 * scale, 0, (d / 2) * 0.96]}>
        <boxGeometry args={[0.01, h * 0.9, 0.02]} />
        <meshStandardMaterial color="#12141F" />
      </mesh>
      {[-0.05, 0.15].map((fy, i) => (
        <mesh key={i} position={[handleX, fy * scale, (d / 2) * 0.98]} castShadow>
          <sphereGeometry args={[0.02 * scale, 8, 8]} />
          <meshStandardMaterial color="#C9B98C" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function WalkInCloset({ palette, x, z, ry = 0 }: { palette: PaletteSet; x: number; z: number; ry?: number }) {
  return (
    <group position={[x, -0.35, z]} rotation={[0, ry, 0]}>
      <RoundedBox args={[1.3, 1.5, 0.55]} radius={0.03} castShadow receiveShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.5} />
      </RoundedBox>
      {[-0.4, -0.1, 0.2, 0.5].map((hx, i) => (
        <RoundedBox key={i} args={[0.11, 0.55, 0.05]} radius={0.02} position={[hx, 0.25, 0.28]} castShadow>
          <meshStandardMaterial color={i % 2 === 0 ? palette.accent : palette.linen} roughness={0.8} />
        </RoundedBox>
      ))}
    </group>
  );
}

function Desk({ palette, x, z, ry = 0 }: { palette: PaletteSet; x: number; z: number; ry?: number }) {
  return (
    <group position={[x, -0.72, z]} rotation={[0, ry, 0]}>
      <RoundedBox args={[1.1, 0.06, 0.55]} radius={0.02} position={[0, 0.36, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.45} />
      </RoundedBox>
      {[
        [-0.5, -0.22],
        [0.5, -0.22],
        [-0.5, 0.22],
        [0.5, 0.22],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.16, lz]} castShadow>
          <boxGeometry args={[0.05, 0.36, 0.05]} />
          <meshStandardMaterial color="#2A2A2A" roughness={0.5} />
        </mesh>
      ))}
      <group position={[0, 0, 0.5]}>
        <RoundedBox args={[0.4, 0.06, 0.4]} radius={0.03} position={[0, 0.02, 0]} castShadow>
          <meshStandardMaterial color={palette.accent} roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[0.4, 0.38, 0.06]} radius={0.03} position={[0, 0.21, 0.17]} castShadow>
          <meshStandardMaterial color={palette.accent} roughness={0.8} />
        </RoundedBox>
        {[
          [-0.16, -0.16],
          [0.16, -0.16],
          [-0.16, 0.16],
          [0.16, 0.16],
        ].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, -0.12, lz]}>
            <boxGeometry args={[0.04, 0.28, 0.04]} />
            <meshStandardMaterial color="#2A2A2A" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function WallTV({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  return (
    <group position={[x, 0.5, z]} rotation={[0, ry, 0]}>
      <RoundedBox args={[0.85, 0.5, 0.04]} radius={0.02} castShadow>
        <meshStandardMaterial color="#101114" roughness={0.3} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[0.78, 0.44]} />
        <meshStandardMaterial color="#1B2230" emissive="#2B3A67" emissiveIntensity={0.4} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Armchair({ palette, x, z, ry = 0 }: { palette: PaletteSet; x: number; z: number; ry?: number }) {
  return (
    <group position={[x, -0.78, z]} rotation={[0, ry, 0]}>
      <RoundedBox args={[0.62, 0.42, 0.6]} radius={0.1} castShadow receiveShadow>
        <meshStandardMaterial color={palette.accent} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.5, 0.12]} radius={0.08} position={[0, 0.38, -0.26]} castShadow>
        <meshStandardMaterial color={palette.accent} roughness={0.85} />
      </RoundedBox>
      {[-0.28, 0.28].map((ax, i) => (
        <RoundedBox key={i} args={[0.1, 0.28, 0.55]} radius={0.05} position={[ax, 0.25, 0]} castShadow>
          <meshStandardMaterial color={palette.accent} roughness={0.85} />
        </RoundedBox>
      ))}
    </group>
  );
}

function Sofa({ palette, x, z, ry = 0 }: { palette: PaletteSet; x: number; z: number; ry?: number }) {
  return (
    <group position={[x, -0.78, z]} rotation={[0, ry, 0]}>
      <RoundedBox args={[1.7, 0.42, 0.65]} radius={0.1} castShadow receiveShadow>
        <meshStandardMaterial color={palette.accent} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[1.7, 0.48, 0.14]} radius={0.08} position={[0, 0.36, -0.28]} castShadow>
        <meshStandardMaterial color={palette.accent} roughness={0.85} />
      </RoundedBox>
      {[-0.8, 0.8].map((ax, i) => (
        <RoundedBox key={i} args={[0.1, 0.3, 0.6]} radius={0.05} position={[ax, 0.25, 0]} castShadow>
          <meshStandardMaterial color={palette.accent} roughness={0.85} />
        </RoundedBox>
      ))}
      {[-0.35, 0.35].map((cx, i) => (
        <RoundedBox key={i} args={[0.32, 0.16, 0.32]} radius={0.04} position={[cx, 0.3, 0.06]} rotation={[0.15, i * 0.4, 0]} castShadow>
          <meshStandardMaterial color={palette.linen} roughness={0.9} />
        </RoundedBox>
      ))}
    </group>
  );
}

function SideTable({ palette, x, z }: { palette: PaletteSet; x: number; z: number }) {
  return (
    <mesh position={[x, -0.85, z]} castShadow receiveShadow>
      <cylinderGeometry args={[0.18, 0.16, 0.3, 16]} />
      <meshStandardMaterial color={palette.wood} roughness={0.45} />
    </mesh>
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

function MiniFridge({ x, z }: { x: number; z: number }) {
  return (
    <RoundedBox args={[0.42, 0.5, 0.42]} radius={0.03} position={[x, -0.75, z]} castShadow receiveShadow>
      <meshStandardMaterial color="#EDEDED" roughness={0.35} metalness={0.2} />
    </RoundedBox>
  );
}

function CoffeeStation({ palette, x, z, ry = 0 }: { palette: PaletteSet; x: number; z: number; ry?: number }) {
  return (
    <group position={[x, -0.72, z]} rotation={[0, ry, 0]}>
      <RoundedBox args={[0.6, 0.06, 0.32]} radius={0.02} position={[0, 0.42, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.45} />
      </RoundedBox>
      <mesh position={[-0.15, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.14, 12]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.4} metalness={0.5} />
      </mesh>
      {[0.08, 0.2].map((cx, i) => (
        <mesh key={i} position={[cx, 0.47, 0.05]} castShadow>
          <cylinderGeometry args={[0.035, 0.03, 0.06, 10]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
        </mesh>
      ))}
      {[
        [-0.25, -0.12],
        [0.25, -0.12],
        [-0.25, 0.12],
        [0.25, 0.12],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.2, lz]}>
          <boxGeometry args={[0.03, 0.44, 0.03]} />
          <meshStandardMaterial color="#2A2A2A" />
        </mesh>
      ))}
    </group>
  );
}

function MiniBar({ palette, x, z, ry = 0 }: { palette: PaletteSet; x: number; z: number; ry?: number }) {
  return (
    <group position={[x, -0.72, z]} rotation={[0, ry, 0]}>
      <RoundedBox args={[0.8, 0.56, 0.32]} radius={0.03} castShadow receiveShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.4} />
      </RoundedBox>
      {[-0.22, 0, 0.22].map((bx, i) => (
        <mesh key={i} position={[bx, 0.36, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.035, 0.22, 8]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#3F7A5C' : '#A3503F'} roughness={0.3} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function DiningSet({ palette, x, z }: { palette: PaletteSet; x: number; z: number }) {
  return (
    <group position={[x, -0.72, z]}>
      <RoundedBox args={[0.9, 0.06, 0.9]} radius={0.02} position={[0, 0.36, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={palette.wood} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.36, 12]} />
        <meshStandardMaterial color="#2A2A2A" metalness={0.4} roughness={0.4} />
      </mesh>
      {[
        [-0.65, 0],
        [0.65, 0],
        [0, -0.65],
        [0, 0.65],
      ].map(([cx, cz], i) => (
        <group key={i} position={[cx, 0, cz]}>
          <RoundedBox args={[0.32, 0.06, 0.32]} radius={0.03} position={[0, 0.02, 0]} castShadow>
            <meshStandardMaterial color={palette.wallAccent} roughness={0.8} />
          </RoundedBox>
          <RoundedBox
            // Backrest sits on the outward side (away from table center) so the seat faces in.
            args={[0.32, 0.34, 0.05]}
            radius={0.03}
            position={[cx !== 0 ? Math.sign(cx) * 0.13 : 0, 0.2, cz !== 0 ? Math.sign(cz) * 0.13 : 0]}
            castShadow
          >
            <meshStandardMaterial color={palette.wallAccent} roughness={0.8} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

function Bathtub({ x, z, jacuzzi = false }: { x: number; z: number; jacuzzi?: boolean }) {
  const w = jacuzzi ? 1.3 : 1.1;
  return (
    <group position={[x, -0.8, z]}>
      <RoundedBox args={[w, 0.4, 0.7]} radius={0.18} castShadow receiveShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.25} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[w - 0.2, 0.22, 0.5]} radius={0.14} position={[0, 0.12, 0]}>
        <meshStandardMaterial color="#E7F1F5" roughness={0.15} metalness={0.1} />
      </RoundedBox>
      {jacuzzi &&
        [-0.4, 0, 0.4].map((jx, i) => (
          <mesh key={i} position={[jx, 0.18, -0.2]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#C9B98C" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      <mesh position={[0, -0.19, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.7, 1.35]} />
        <meshStandardMaterial color="#E7E1D3" roughness={0.4} />
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
        <mesh key={i} position={[Math.sin(i) * 0.08, 0.55 + i * 0.06, Math.cos(i) * 0.08]} rotation={[0.3, i * 1.2, 0]} castShadow>
          <coneGeometry args={[0.14, 0.55, 8]} />
          <meshStandardMaterial color={i % 2 === 0 ? PLANT_GREEN : PLANT_GREEN_DARK} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function LuggageBench({ palette, x, z }: { palette: PaletteSet; x: number; z: number }) {
  return (
    <RoundedBox args={[1.3, 0.28, 0.5]} radius={0.05} position={[x, -0.86, z]} castShadow receiveShadow>
      <meshStandardMaterial color={palette.linen} roughness={0.85} />
    </RoundedBox>
  );
}

function PendantLight({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 1.35, z]}>
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

function Rug({ palette, x, z, roundShape, radius }: { palette: PaletteSet; x: number; z: number; roundShape: boolean; radius: number }) {
  const y = -0.99;
  if (roundShape) {
    return (
      <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color={palette.wallAccent} roughness={1} />
      </mesh>
    );
  }
  return (
    <RoundedBox args={[radius * 1.7, 0.02, radius * 1.2]} radius={0.08} position={[x, y, z]} receiveShadow>
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

/** A window embedded flush in the back wall — always coplanar with it, so it never looks
    detached/floating regardless of the camera's orbit angle. */
function Window({ palette, x, z, wide = false }: { palette: PaletteSet; x: number; z: number; wide?: boolean }) {
  const texture = useSkyTexture(palette);
  const w = wide ? 1.9 : 1.1;
  const h = wide ? 2.05 : 1.3;
  return (
    <group position={[x, h / 2 - 0.98, z]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {wide && (
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.05, h, 0.04]} />
          <meshStandardMaterial color={TRIM} roughness={0.8} />
        </mesh>
      )}
      {[-w / 2 + 0.02, w / 2 - 0.02].map((wx) => (
        <mesh key={wx} position={[wx, 0, 0.01]}>
          <boxGeometry args={[0.04, h, 0.04]} />
          <meshStandardMaterial color={TRIM} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, h / 2 - 0.02, 0.01]}>
        <boxGeometry args={[w, 0.04, 0.04]} />
        <meshStandardMaterial color={TRIM} roughness={0.8} />
      </mesh>
      <mesh position={[0, -h / 2 + 0.03, 0.05]}>
        <boxGeometry args={[w + 0.1, 0.05, 0.12]} />
        <meshStandardMaterial color={TRIM} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Divider({ palette, x, z }: { palette: PaletteSet; x: number; z: number }) {
  return (
    <RoundedBox args={[2.2, 0.5, 0.25]} radius={0.03} position={[x, -0.75, z]} castShadow receiveShadow>
      <meshStandardMaterial color={palette.wood} roughness={0.5} />
    </RoundedBox>
  );
}

// ---------- Type-specific room layouts ----------

function StandardRoomScene({ palette, seed }: { palette: PaletteSet; seed: number }) {
  const floorSize = FLOOR_SIZE.standard;
  const wallHeight = WALL_HEIGHT.standard;
  const wallX = floorSize / 2;
  const mirrored = seed % 2 === 0;

  return (
    <>
      <RoomShell palette={palette} floorSize={floorSize} wallHeight={wallHeight} />
      <Rug palette={palette} x={0} z={0.3} roundShape={seed % 3 !== 0} radius={0.85} />
      <Bed palette={palette} x={0} z={0.1} wide={false} />
      <Nightstand palette={palette} x={mirrored ? 1.05 : -1.05} z={-0.25} warmShade />
      <Wardrobe palette={palette} x={mirrored ? -1.55 : 1.55} z={-1.85} mirrored={!mirrored} scale={0.82} />
      <Window palette={palette} x={mirrored ? 1.3 : -1.3} z={-wallZFor(floorSize)} />
      <WallTV x={-wallX + 0.03} z={0.9} ry={Math.PI / 2} />
      <Desk palette={palette} x={-wallX + 0.62} z={1.55} ry={Math.PI / 2} />
      <ContactShadows position={[0, -0.995, 0]} opacity={0.4} scale={floorSize + 1} blur={2.2} far={2} />
    </>
  );
}

function DeluxeRoomScene({ palette, seed }: { palette: PaletteSet; seed: number }) {
  const floorSize = FLOOR_SIZE.deluxe;
  const wallHeight = WALL_HEIGHT.deluxe;
  const wallX = floorSize / 2;
  const mirrored = seed % 2 === 0;

  return (
    <>
      <RoomShell palette={palette} floorSize={floorSize} wallHeight={wallHeight} />
      <Rug palette={palette} x={0} z={0.3} roundShape={seed % 3 !== 0} radius={1.2} />
      <Bed palette={palette} x={0} z={0.05} wide />
      <Nightstand palette={palette} x={-1.55} z={-0.3} warmShade={seed % 2 === 0} />
      <Nightstand palette={palette} x={1.55} z={-0.3} warmShade={seed % 2 !== 0} />
      <Wardrobe palette={palette} x={mirrored ? -2.35 : 2.35} z={-2.42} mirrored={!mirrored} scale={1.1} />
      <Window palette={palette} x={mirrored ? 1.2 : -1.2} z={-wallZFor(floorSize)} wide />
      <Armchair palette={palette} x={mirrored ? -2.3 : 2.3} z={1.9} ry={mirrored ? 0.6 : -0.6} />
      <SideTable palette={palette} x={mirrored ? -1.72 : 1.72} z={2.1} />
      <MiniFridge x={mirrored ? 2.55 : -2.55} z={1.6} />
      <CoffeeStation palette={palette} x={mirrored ? 2.4 : -2.4} z={0.6} ry={mirrored ? -Math.PI / 2 : Math.PI / 2} />
      <WallArt palette={palette} x={mirrored ? wallX - 0.02 : -wallX + 0.02} z={-0.9} ry={mirrored ? -Math.PI / 2 : Math.PI / 2} />
      <Plant x={mirrored ? 2.45 : -2.45} z={2.55} />
      <ContactShadows position={[0, -0.995, 0]} opacity={0.42} scale={floorSize + 1} blur={2.3} far={2} />
    </>
  );
}

function SuiteRoomScene({ palette, seed }: { palette: PaletteSet; seed: number }) {
  const floorSize = FLOOR_SIZE.suite;
  const wallHeight = WALL_HEIGHT.suite;
  const wallX = floorSize / 2;
  const mirrored = seed % 2 === 0;
  const bedX = mirrored ? 0.4 : -0.4;
  const closetX = mirrored ? -2.6 : 2.6;
  const tubX = mirrored ? 3.1 : -3.1;
  const sofaX = mirrored ? 2.6 : -2.6;
  const tableAreaX = mirrored ? -2.2 : 2.2;

  return (
    <>
      <RoomShell palette={palette} floorSize={floorSize} wallHeight={wallHeight} />

      {/* Bedroom zone (back half) */}
      <Rug palette={palette} x={bedX} z={-1.9} roundShape={seed % 3 !== 0} radius={1.0} />
      <Bed palette={palette} x={bedX} z={-1.9} wide />
      <Nightstand palette={palette} x={bedX - 1.55} z={-2.2} warmShade />
      <Nightstand palette={palette} x={bedX + 1.15} z={-2.2} warmShade={false} />
      <WalkInCloset palette={palette} x={closetX} z={-3.15} />
      <Bathtub x={tubX} z={-3.0} jacuzzi />
      <Window palette={palette} x={mirrored ? -0.6 : 0.6} z={-wallZFor(floorSize)} wide />
      <Divider palette={palette} x={0.3 * (mirrored ? -1 : 1)} z={-0.55} />

      {/* Living zone (front half, nearer the open camera side) */}
      <Sofa palette={palette} x={sofaX} z={1.0} ry={mirrored ? -Math.PI / 2 : Math.PI / 2} />
      <CoffeeTable palette={palette} x={sofaX + (mirrored ? -0.75 : 0.75)} z={1.0} />
      <Armchair palette={palette} x={sofaX + (mirrored ? -1.15 : 1.15)} z={1.75} ry={mirrored ? 2.0 : -2.0} />
      <DiningSet palette={palette} x={tableAreaX} z={2.6} />
      <MiniBar palette={palette} x={tableAreaX * 0.5} z={0.3} />
      <LuggageBench palette={palette} x={0} z={3.3} />
      <PendantLight x={sofaX + (mirrored ? -0.75 : 0.75)} z={1.0} />
      <Plant x={-tableAreaX * 0.9} z={3.2} />
      <WallArt palette={palette} x={closetX * 0.7} z={-wallZFor(floorSize) + 0.02} ry={0} />
      <WallArt palette={palette} x={-wallX + 0.02} z={1.6} ry={Math.PI / 2} />

      <ContactShadows position={[0, -0.995, 0]} opacity={0.45} scale={floorSize + 1} blur={2.5} far={2.4} />
    </>
  );
}

function wallZFor(floorSize: number) {
  return floorSize / 2 - 0.02;
}

function RoomScene({ roomName, hotelCategory, priceTier = 0.5 }: RoomPreviewProps) {
  const groupRef = useRef<THREE.Group>(null);
  const palette = useMemo(() => getPalette(hotelCategory), [hotelCategory]);
  const seed = useMemo(() => seedFromName(roomName), [roomName]);
  const roomType = useMemo(() => roomTypeFromName(roomName), [roomName]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={groupRef}>
      {roomType === 'standard' && <StandardRoomScene palette={palette} seed={seed} />}
      {roomType === 'deluxe' && <DeluxeRoomScene palette={palette} seed={seed} />}
      {roomType === 'suite' && <SuiteRoomScene palette={palette} seed={seed} />}
      {/* priceTier is a light secondary touch: a pricier room of the same type gets one extra plant */}
      {priceTier >= 0.75 && roomType !== 'suite' && <Plant x={roomType === 'deluxe' ? 0 : -1.6} z={roomType === 'deluxe' ? -2.6 : 1.6} />}
    </group>
  );
}

export default function RoomPreview({ roomName, hotelCategory, priceTier = 0.5 }: RoomPreviewProps) {
  const roomType = useMemo(() => roomTypeFromName(roomName), [roomName]);
  const floorSize = FLOOR_SIZE[roomType];
  const camMult = floorSize / FLOOR_SIZE.standard;

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [3.2 * camMult, 1.4 + camMult * 0.3, 3.7 * camMult], fov: 42 }}
      className="w-full h-full"
      gl={{ antialias: true }}
    >
      <color attach="background" args={[getPalette(hotelCategory).sky[0]]} />
      <hemisphereLight args={[getPalette(hotelCategory).sky[0], '#403528', 0.65]} />
      <directionalLight position={[4, 5, 2]} intensity={1.4} color="#FFF3DE" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-1.05, -0.3, -0.1]} intensity={0.4} color="#F4C98B" distance={2} />

      <RoomScene roomName={roomName} hotelCategory={hotelCategory} priceTier={priceTier} />

      <OrbitControls
        autoRotate={false}
        enableZoom
        enablePan={false}
        minDistance={2.6 * camMult}
        maxDistance={6 * camMult + 1.5}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, -0.3, 0]}
      />
    </Canvas>
  );
}
