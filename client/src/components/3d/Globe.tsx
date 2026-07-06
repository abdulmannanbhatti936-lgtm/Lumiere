import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function GlobeMesh({ onLocationClick }: GlobeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005;
    }
  });

  useEffect(() => {
    if (meshRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;

      // Dark background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Continents (simplified)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 300, 400, 400);
      ctx.fillRect(600, 200, 500, 500);
      ctx.fillRect(1200, 250, 400, 450);

      // Ocean glow
      ctx.strokeStyle = '#ffc107';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 50 + 20,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.map = texture;
      }
    }
  }, []);

  return (
    <mesh
      ref={meshRef}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        if (!onLocationClick) return;
        const point = e.point.clone().normalize();
        const lat = 90 - (Math.acos(point.y) * 180) / Math.PI;
        const lng = (((270 + (Math.atan2(point.x, point.z) * 180) / Math.PI) % 360) + 360) % 360 - 180;
        onLocationClick(lat, lng);
      }}
    >
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        color="#1a1a1a"
        metalness={0.4}
        roughness={0.3}
        emissive="#ffc107"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

interface GlobeProps {
  onLocationClick?: (lat: number, lng: number) => void;
}

export default function Globe({ onLocationClick }: GlobeProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      className="w-full h-full"
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        color="#ffffff"
      />
      <pointLight position={[0, 0, 2]} intensity={0.8} color="#ffc107" />

      <GlobeMesh onLocationClick={onLocationClick} />

      <OrbitControls
        autoRotate
        autoRotateSpeed={1}
        enableZoom={true}
        enablePan={false}
      />
    </Canvas>
  );
}
