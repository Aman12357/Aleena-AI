'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function CityView() {
  const celestialRef = useRef<THREE.Mesh>(null);
  const starsRef = useRef<THREE.Points>(null);

  // Generate buildings geometry properties
  const buildings = useMemo(() => {
    const arr = [];
    const count = 25;
    for (let i = 0; i < count; i++) {
      const width = 0.3 + Math.random() * 0.4;
      const height = 1.2 + Math.random() * 2.0;
      const depth = 0.3 + Math.random() * 0.4;
      const x = (i - count / 2) * 0.4;
      const z = -6.0 - Math.random() * 1.5;
      const y = -1.0 + height / 2; // base matches floor Y=-1.0
      const color = new THREE.Color().setHSL(0.7, 0.2, 0.08 + Math.random() * 0.05);
      arr.push({ id: i, size: [width, height, depth], pos: [x, y, z], color });
    }
    return arr;
  }, []);

  // Generate stars positions
  const starsData = useMemo(() => {
    const count = 150;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = 1.0 + Math.random() * 6;
      positions[i * 3 + 2] = -9.0;
    }
    return positions;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Rotate Sun/Moon around the window
    if (celestialRef.current) {
      const angle = t * 0.05;
      celestialRef.current.position.x = Math.sin(angle) * 8;
      celestialRef.current.position.y = Math.cos(angle) * 6;
    }

    // Slowly rotate stars
    if (starsRef.current) {
      starsRef.current.rotation.z = t * 0.005;
    }
  });

  return (
    <group>
      {/* Dynamic Celestial Body (Sun/Moon) */}
      <mesh ref={celestialRef} position={[0, 4, -8.5]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ffffcc" />
      </mesh>

      {/* Starry Night Sky */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starsData, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.8} />
      </points>

      {/* City Buildings Skyline */}
      <group>
        {buildings.map((b) => (
          <group key={b.id} position={b.pos as [number, number, number]}>
            {/* Building box */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={b.size as [number, number, number]} />
              <meshStandardMaterial color={b.color} roughness={0.9} />
            </mesh>

            {/* Glowing windows on building */}
            <mesh position={[0, 0, 0.01 + (b.size[2] / 2)]}>
              <planeGeometry args={[b.size[0] * 0.7, b.size[1] * 0.6]} />
              <meshStandardMaterial 
                color="#ffeaa7" 
                emissive="#fdcb6e" 
                emissiveIntensity={0.6} 
                transparent 
                opacity={0.3} 
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Horizon backdrop */}
      <mesh position={[0, -0.5, -9.5]}>
        <planeGeometry args={[25, 6]} />
        <meshBasicMaterial color="#02020a" />
      </mesh>
    </group>
  );
}
