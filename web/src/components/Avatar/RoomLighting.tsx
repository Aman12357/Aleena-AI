'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function RoomLighting({ emotion }: { emotion: string }) {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  
  const timeOfDayRef = useRef(0.3); // 0.0 to 1.0 cycle

  useFrame((state, delta) => {
    // 1 full cycle = 120 seconds
    const speed = 1 / 120;
    timeOfDayRef.current = (timeOfDayRef.current + delta * speed) % 1.0;
    const newTime = timeOfDayRef.current;

    // Calculate light colors & intensities based on cycle (brightened for high visibility)
    let ambientColor = new THREE.Color('#ebdcfc');
    let ambientIntensity = 0.8;
    let dirColor = new THREE.Color('#f5f0ff');
    let dirIntensity = 1.4;
    let dirX = 2, dirY = 3, dirZ = 4;

    if (newTime < 0.2) {
      // --- Morning (Sunrise to Early Morning) ---
      const p = newTime / 0.2;
      ambientColor.lerpColors(new THREE.Color('#4c3b5c'), new THREE.Color('#ebdcfc'), p);
      ambientIntensity = 0.7 + p * 0.15;
      dirColor.lerpColors(new THREE.Color('#ffbb77'), new THREE.Color('#ffdca8'), p);
      dirIntensity = 0.9 + p * 0.4;
      dirX = -3 + p * 5;
      dirY = 1 + p * 2;
      dirZ = -2;
    } else if (newTime < 0.5) {
      // --- Afternoon (Bright Daylight) ---
      const p = (newTime - 0.2) / 0.3;
      ambientColor.copy(new THREE.Color('#ebdcfc'));
      ambientIntensity = 0.85;
      dirColor.copy(new THREE.Color('#ffffff'));
      dirIntensity = 1.5;
      dirX = 2;
      dirY = 4 - p * 1;
      dirZ = -2 + p * 4;
    } else if (newTime < 0.75) {
      // --- Evening (Sunset) ---
      const p = (newTime - 0.5) / 0.25;
      ambientColor.lerpColors(new THREE.Color('#ebdcfc'), new THREE.Color('#5c4c70'), p);
      ambientIntensity = 0.85 - p * 0.1;
      dirColor.lerpColors(new THREE.Color('#ffffff'), new THREE.Color('#ff7722'), p);
      dirIntensity = 1.5 - p * 0.4;
      dirX = 2 + p * 2;
      dirY = 3 - p * 2.5;
      dirZ = 2;
    } else {
      // --- Night (Cozy Moonlight + Emissives) ---
      const p = (newTime - 0.75) / 0.25;
      ambientColor.lerpColors(new THREE.Color('#5c4c70'), new THREE.Color('#2d243d'), p);
      ambientIntensity = 0.75 - p * 0.05;
      dirColor.lerpColors(new THREE.Color('#ff7722'), new THREE.Color('#77aaff'), p);
      dirIntensity = 1.1 - p * 0.2;
      dirX = 4 - p * 7;
      dirY = 0.5 + p * 1.5;
      dirZ = 2 - p * 4;
    }

    // Apply active emotion overrides if any (e.g. sleep makes it darker)
    if (emotion === 'sleeping') {
      ambientIntensity *= 0.5;
      dirIntensity *= 0.4;
    } else if (emotion === 'excited' || emotion === 'celebration') {
      dirIntensity *= 1.2;
      ambientIntensity *= 1.1;
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.color.copy(ambientColor);
      ambientLightRef.current.intensity = ambientIntensity;
    }

    if (dirLightRef.current) {
      dirLightRef.current.color.copy(dirColor);
      dirLightRef.current.intensity = dirIntensity;
      dirLightRef.current.position.set(dirX, dirY, dirZ);
    }

    // Flicker point light at night to simulate monitors glow
    if (pointLightRef.current) {
      if (newTime > 0.7) {
        pointLightRef.current.intensity = 1.5 + Math.sin(state.clock.getElapsedTime() * 4) * 0.3;
      } else {
        pointLightRef.current.intensity = 0.8;
      }
    }
  });

  return (
    <group>
      {/* Soft Ambient Light */}
      <ambientLight ref={ambientLightRef} intensity={0.8} />

      {/* Main Directional Light (Sun/Moon) */}
      <directionalLight
        ref={dirLightRef}
        castShadow
        position={[2, 3, 4]}
        intensity={1.3}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
      />

      {/* Rim/Monitor Point Light */}
      <pointLight
        ref={pointLightRef}
        position={[2.4, 0.4, -0.5]}
        distance={4.0}
        intensity={1.0}
        color="#7c3aed"
      />

      {/* Backlight glow behind desk */}
      <pointLight
        position={[2.6, -0.3, -1.0]}
        distance={2.5}
        intensity={1.5}
        color="#00f2ff"
      />

      {/* Constant warm ceiling downlights for uniform illumination */}
      <pointLight position={[-2.0, 1.8, -2.0]} distance={4.5} intensity={0.6} color="#ffeaa7" />
      <pointLight position={[2.0, 1.8, -2.0]} distance={4.5} intensity={0.6} color="#ffeaa7" />
      <pointLight position={[-2.0, 1.8, 2.0]} distance={4.5} intensity={0.6} color="#ffeaa7" />
      <pointLight position={[2.0, 1.8, 2.0]} distance={4.5} intensity={0.6} color="#ffeaa7" />
    </group>
  );
}
