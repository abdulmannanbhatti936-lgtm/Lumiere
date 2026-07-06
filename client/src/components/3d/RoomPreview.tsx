import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function RoomScene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Floor */}
      <mesh position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 1, -2]} receiveShadow>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      <mesh position={[-2, 1, 0]} receiveShadow>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Bed */}
      <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.5, 2]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>

      {/* Pillow */}
      <mesh position={[0, 0.1, -0.7]} castShadow>
        <boxGeometry args={[2, 0.3, 0.5]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>

      {/* Window */}
      <mesh position={[2.1, 0.5, 0]} castShadow>
        <planeGeometry args={[0.1, 1.5]} />
        <meshStandardMaterial color="#ffc107" emissive="#ffc107" emissiveIntensity={0.3} />
      </mesh>

      {/* Lamp */}
      <mesh position={[1, 0.5, -0.8]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.8, 16]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      <mesh position={[1, 1.1, -0.8]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#ffc107"
          emissive="#ffc107"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* TV */}
      <mesh position={[-2.1, 0.8, 0]} castShadow>
        <boxGeometry args={[0.1, 1, 1.5]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );
}

export default function RoomPreview() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 5], fov: 50 }}
      className="w-full h-full"
    >
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
      />
      <pointLight position={[1, 1, 1]} intensity={0.5} color="#ffc107" />

      <RoomScene />

      <OrbitControls
        autoRotate
        autoRotateSpeed={2}
        enableZoom={true}
      />
    </Canvas>
  );
}
