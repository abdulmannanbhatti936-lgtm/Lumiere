import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import * as THREE from 'three';

function HotelBox() {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main Building */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Windows */}
      {[...Array(9)].map((_, i) => (
        <mesh
          key={i}
          position={[
            -0.6 + (i % 3) * 0.6,
            0.5 + Math.floor(i / 3) * 0.8,
            1.1,
          ]}
          castShadow
        >
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial
            color="#00D9FF"
            emissive="#00D9FF"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}

      {/* Roof */}
      <mesh position={[0, 3.1, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.5, 0.5, 4]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      {/* Entrance */}
      <mesh position={[0, 0.5, 1.1]} castShadow>
        <boxGeometry args={[0.6, 1, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    </group>
  );
}

export default function HotelModel() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 5], fov: 50 }}
      className="w-full h-full"
    >
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 5, 5]} intensity={0.5} color="#00D9FF" />

      <Stage environment="city" intensity={0.5}>
        <HotelBox />
      </Stage>

      <OrbitControls
        autoRotate
        autoRotateSpeed={2}
        enableZoom={true}
        enablePan={true}
      />
    </Canvas>
  );
}
