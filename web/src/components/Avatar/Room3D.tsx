'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { avatarController } from './controllers/AvatarController';

const EMOTION_LED_COLORS: Record<string, string> = {
  neutral: '#7c3aed',
  happy: '#ff85a2',
  excited: '#ff0077',
  thinking: '#00b4d8',
  curious: '#ffae00',
  listening: '#00f2ff',
  talking: '#00ffaa',
  sleeping: '#1e1b4b',
  waiting: '#ffaa00',
  confused: '#d946ef',
  sad: '#3b82f6',
  angry: '#ef4444',
  shy: '#fda4af',
  love: '#ff007f',
  celebration: '#fbbf24',
};

interface Room3DProps {
  emotion?: string;
  onObjectClick?: (target: string, x: number, y: number) => void;
}

export function Room3D({ emotion = 'neutral', onObjectClick }: Room3DProps) {
  const leftCurtainRef = useRef<THREE.Mesh>(null);
  const rightCurtainRef = useRef<THREE.Mesh>(null);
  const plant1Ref = useRef<THREE.Group>(null);
  const plant2Ref = useRef<THREE.Group>(null);
  const ledStripRef = useRef<THREE.Mesh>(null);
  const aiGadgetRef = useRef<THREE.Mesh>(null);

  const ledColor = EMOTION_LED_COLORS[emotion] || EMOTION_LED_COLORS.neutral;

  // Helper to change cursor on hover
  const enablePointer = () => { document.body.style.cursor = 'pointer'; };
  const disablePointer = () => { document.body.style.cursor = 'default'; };

  // Animate curtains, plants, LED strip, and AI gadget
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Curtains slow sway
    if (leftCurtainRef.current) {
      leftCurtainRef.current.position.x = -3.1 + Math.sin(t * 0.5) * 0.02;
    }
    if (rightCurtainRef.current) {
      rightCurtainRef.current.position.x = 3.1 - Math.sin(t * 0.5) * 0.02;
    }

    // Plants gentle swaying
    if (plant1Ref.current) {
      plant1Ref.current.rotation.z = Math.sin(t * 0.8) * 0.03;
      plant1Ref.current.rotation.x = Math.cos(t * 0.6) * 0.02;
    }
    if (plant2Ref.current) {
      plant2Ref.current.rotation.z = Math.cos(t * 0.7) * 0.03;
      plant2Ref.current.rotation.x = Math.sin(t * 0.5) * 0.02;
    }

    // LED strip subtle pulsing
    if (ledStripRef.current && ledStripRef.current.material) {
      const mat = ledStripRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.2 + Math.sin(t * 2.0) * 0.4;
      mat.emissive.set(new THREE.Color(ledColor));
      mat.color.set(new THREE.Color(ledColor));
    }

    // AI Gadget gentle float
    if (aiGadgetRef.current) {
      aiGadgetRef.current.position.y = 0.78 + Math.sin(t * 1.5) * 0.015;
      aiGadgetRef.current.rotation.y = t * 0.5;
    }
  });

  return (
    <group>
      {/* ================= FLOOR & CEILING ================= */}
      {/* Floor with Click-to-Move */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1.0, 0]} 
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          avatarController.walkToPoint(e.point);
        }}
        onPointerOver={() => { document.body.style.cursor = 'crosshair'; }}
        onPointerOut={disablePointer}
      >
        <planeGeometry args={[7, 6]} />
        <meshStandardMaterial color="#8e6345" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Carpet */}
      <mesh 
        position={[0, -0.99, 0.5]} 
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          avatarController.walkToPoint(e.point);
        }}
        onPointerOver={() => { document.body.style.cursor = 'crosshair'; }}
        onPointerOut={disablePointer}
      >
        <cylinderGeometry args={[1.5, 1.5, 0.01, 32]} />
        <meshStandardMaterial color="#bca3cf" roughness={0.95} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.0, 0]}>
        <planeGeometry args={[7, 6]} />
        <meshStandardMaterial color="#dbd5e0" roughness={0.8} />
      </mesh>

      {/* Ceiling spotlight fixtures */}
      <mesh position={[-2.0, 1.99, -2.0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <meshStandardMaterial color="#fff" emissive="#ffeaae" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[2.0, 1.99, -2.0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <meshStandardMaterial color="#fff" emissive="#ffeaae" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-2.0, 1.99, 2.0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <meshStandardMaterial color="#fff" emissive="#ffeaae" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[2.0, 1.99, 2.0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <meshStandardMaterial color="#fff" emissive="#ffeaae" emissiveIntensity={1.5} />
      </mesh>

      {/* ================= PHYSICAL WALLS ================= */}
      {/* Left Wall */}
      <mesh position={[-3.5, 0.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#5a4d6a" roughness={0.7} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[3.5, 0.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#5a4d6a" roughness={0.7} />
      </mesh>

      {/* Panoramic Back Window (Floor-to-Ceiling) */}
      <group 
        position={[0, 0.5, -3.0]}
        onClick={(e) => {
          e.stopPropagation();
          avatarController.moveTo('window');
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          if (onObjectClick) onObjectClick('window', e.clientX, e.clientY);
        }}
        onPointerOver={enablePointer}
        onPointerOut={disablePointer}
      >
        {/* Left corner pillar */}
        <mesh position={[-3.45, 0, 0]}>
          <boxGeometry args={[0.1, 3.0, 0.15]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
        {/* Right corner pillar */}
        <mesh position={[3.45, 0, 0]}>
          <boxGeometry args={[0.1, 3.0, 0.15]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
        {/* Top header beam */}
        <mesh position={[0, 1.45, 0]}>
          <boxGeometry args={[7.0, 0.1, 0.15]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
        {/* Bottom sill beam */}
        <mesh position={[0, -1.45, 0]}>
          <boxGeometry args={[7.0, 0.1, 0.15]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
        {/* intermediate vertical pillars */}
        <mesh position={[-1.15, 0, 0]}>
          <boxGeometry args={[0.06, 2.8, 0.1]} />
          <meshStandardMaterial color="#222" roughness={0.5} />
        </mesh>
        <mesh position={[1.15, 0, 0]}>
          <boxGeometry args={[0.06, 2.8, 0.1]} />
          <meshStandardMaterial color="#222" roughness={0.5} />
        </mesh>

        {/* Glass panels (left, middle, right) */}
        <mesh position={[-2.3, 0, -0.01]}>
          <boxGeometry args={[2.2, 2.8, 0.02]} />
          <meshStandardMaterial color="#a5f3fc" transparent opacity={0.08} roughness={0.05} metalness={0.0} />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[2.2, 2.8, 0.02]} />
          <meshStandardMaterial color="#a5f3fc" transparent opacity={0.08} roughness={0.05} metalness={0.0} />
        </mesh>
        <mesh position={[2.3, 0, -0.01]}>
          <boxGeometry args={[2.2, 2.8, 0.02]} />
          <meshStandardMaterial color="#a5f3fc" transparent opacity={0.08} roughness={0.05} metalness={0.0} />
        </mesh>
      </group>

      {/* Curtains (moved to far sides of the room) */}
      <group position={[0, 0.5, -2.9]}>
        <mesh ref={leftCurtainRef} position={[-3.1, 0, 0]}>
          <boxGeometry args={[0.6, 2.8, 0.05]} />
          <meshStandardMaterial color="#2d2d44" roughness={0.9} />
        </mesh>
        <mesh ref={rightCurtainRef} position={[3.1, 0, 0]}>
          <boxGeometry args={[0.6, 2.8, 0.05]} />
          <meshStandardMaterial color="#2d2d44" roughness={0.9} />
        </mesh>
      </group>

      {/* ================= BED (LEFT SIDE) ================= */}
      <group 
        position={[-2.3, -1.0, -0.8]}
        onClick={(e) => {
          e.stopPropagation();
          avatarController.moveTo('bed');
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          if (onObjectClick) onObjectClick('bed', e.clientX, e.clientY);
        }}
        onPointerOver={enablePointer}
        onPointerOut={disablePointer}
      >
        {/* Bed frame */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.4, 2.2]} />
          <meshStandardMaterial color="#302015" roughness={0.6} />
        </mesh>
        {/* Mattress */}
        <mesh position={[0, 0.45, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.2, 2.0]} />
          <meshStandardMaterial color="#eaeaea" roughness={0.8} />
        </mesh>
        {/* Blanket/Sheet */}
        <mesh position={[0, 0.48, 0.25]} castShadow receiveShadow>
          <boxGeometry args={[1.42, 0.18, 1.5]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.7} />
        </mesh>
        {/* Pillows */}
        <mesh position={[-0.35, 0.58, -0.7]} castShadow>
          <boxGeometry args={[0.5, 0.12, 0.35]} />
          <meshStandardMaterial color="#eaeaea" roughness={0.9} />
        </mesh>
        <mesh position={[0.35, 0.58, -0.7]} castShadow>
          <boxGeometry args={[0.5, 0.12, 0.35]} />
          <meshStandardMaterial color="#eaeaea" roughness={0.9} />
        </mesh>
      </group>

      {/* ================= BEDSIDE TABLE & LAMP ================= */}
      <group position={[-3.1, -1.0, -1.7]}>
        {/* Bedside Table box */}
        <mesh position={[0, 0.225, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.45, 0.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* Table drawer handle */}
        <mesh position={[0.201, 0.225, 0]}>
          <boxGeometry args={[0.02, 0.02, 0.1]} />
          <meshStandardMaterial color="#111" metalness={0.9} />
        </mesh>
        {/* Lamp Base */}
        <mesh position={[0, 0.525, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.15]} />
          <meshStandardMaterial color="#888" metalness={0.9} />
        </mesh>
        {/* Lamp Shade */}
        <mesh position={[0, 0.675, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.12, 0.15, 16]} />
          <meshStandardMaterial color="#faf9f6" emissive="#ffc77d" emissiveIntensity={1.2} />
        </mesh>
        {/* Warm light source */}
        <pointLight position={[0, 0.675, 0]} distance={3.5} intensity={0.9} color="#ffeaa7" />
      </group>

      {/* ================= MODERN SOFA (FRONT LEFT) ================= */}
      <group 
        position={[-2.4, -1.0, 1.4]} 
        rotation={[0, Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          avatarController.sit('sofa');
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          if (onObjectClick) onObjectClick('sofa', e.clientX, e.clientY);
        }}
        onPointerOver={enablePointer}
        onPointerOut={disablePointer}
      >
        {/* Seat cushion base */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.3, 0.8]} />
          <meshStandardMaterial color="#8c7b99" roughness={0.8} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.65, -0.325]} castShadow>
          <boxGeometry args={[1.5, 0.5, 0.15]} />
          <meshStandardMaterial color="#786885" roughness={0.8} />
        </mesh>
        {/* Left Armrest */}
        <mesh position={[-0.675, 0.4, 0]} castShadow>
          <boxGeometry args={[0.15, 0.4, 0.8]} />
          <meshStandardMaterial color="#786885" roughness={0.8} />
        </mesh>
        {/* Right Armrest */}
        <mesh position={[0.675, 0.4, 0]} castShadow>
          <boxGeometry args={[0.15, 0.4, 0.8]} />
          <meshStandardMaterial color="#786885" roughness={0.8} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.65, 0.05, -0.3]} castShadow>
          <cylinderGeometry args={[0.03, 0.02, 0.1]} />
          <meshStandardMaterial color="#111" metalness={0.8} />
        </mesh>
        <mesh position={[0.65, 0.05, -0.3]} castShadow>
          <cylinderGeometry args={[0.03, 0.02, 0.1]} />
          <meshStandardMaterial color="#111" metalness={0.8} />
        </mesh>
        {/* Front Legs */}
        <mesh position={[-0.65, 0.05, 0.3]} castShadow>
          <cylinderGeometry args={[0.03, 0.02, 0.1]} />
          <meshStandardMaterial color="#111" metalness={0.8} />
        </mesh>
        <mesh position={[0.65, 0.05, 0.3]} castShadow>
          <cylinderGeometry args={[0.03, 0.02, 0.1]} />
          <meshStandardMaterial color="#111" metalness={0.8} />
        </mesh>
      </group>

      {/* ================= DESK (RIGHT SIDE - PARALLEL TO BACK WALL) ================= */}
      <group position={[1.9, -1.0, -1.8]}>
        {/* Desk top */}
        <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.05, 0.8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Desk legs */}
        <mesh position={[-0.8, 0.35, -0.3]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.7]} />
          <meshStandardMaterial color="#111" metalness={0.9} />
        </mesh>
        {/* Front-left leg */}
        <mesh position={[-0.8, 0.35, 0.3]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.7]} />
          <meshStandardMaterial color="#111" metalness={0.9} />
        </mesh>
        {/* Back-right leg */}
        <mesh position={[0.8, 0.35, -0.3]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.7]} />
          <meshStandardMaterial color="#111" metalness={0.9} />
        </mesh>
        {/* Front-right leg */}
        <mesh position={[0.8, 0.35, 0.3]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.7]} />
          <meshStandardMaterial color="#111" metalness={0.9} />
        </mesh>

        {/* Dual Monitors (facing the camera / +Z direction) */}
        <group position={[0, 0.725, -0.2]}>
          {/* Monitor Stands */}
          <mesh position={[-0.45, 0.15, 0]} castShadow>
            <boxGeometry args={[0.1, 0.3, 0.1]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0.45, 0.15, 0]} castShadow>
            <boxGeometry args={[0.1, 0.3, 0.1]} />
            <meshStandardMaterial color="#222" />
          </mesh>

          {/* Left Monitor Screen */}
          <mesh position={[-0.45, 0.35, 0]} rotation={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.7, 0.45, 0.03]} />
            <meshStandardMaterial color="#000" roughness={0.1} />
          </mesh>
          <mesh position={[-0.45, 0.35, 0.016]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.68, 0.43, 0.001]} />
            <meshStandardMaterial color="#a855f7" emissive="#7c3aed" emissiveIntensity={1.5} />
          </mesh>

          {/* Right Monitor Screen */}
          <mesh position={[0.45, 0.35, 0]} rotation={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.7, 0.45, 0.03]} />
            <meshStandardMaterial color="#000" roughness={0.1} />
          </mesh>
          <mesh position={[0.45, 0.35, 0.016]} rotation={[0, -0.2, 0]}>
            <boxGeometry args={[0.68, 0.43, 0.001]} />
            <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={1.5} />
          </mesh>
        </group>

        {/* Keyboard and Mouse */}
        <mesh position={[0, 0.73, 0.15]} castShadow>
          <boxGeometry args={[0.55, 0.015, 0.2]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0.4, 0.73, 0.15]} castShadow>
          <boxGeometry args={[0.08, 0.015, 0.05]} />
          <meshStandardMaterial color="#333" />
        </mesh>

        {/* Desk Table Lamp */}
        <group position={[-0.7, 0.725, -0.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.02]} />
            <meshStandardMaterial color="#444" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.01, 0.01, 0.3]} />
            <meshStandardMaterial color="#aaa" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.15, 0.15]} />
            <meshStandardMaterial color="#eaeaea" emissive="#ffc77d" emissiveIntensity={0.8} />
          </mesh>
        </group>
      </group>

      {/* ================= GAMING CHAIR ================= */}
      <group 
        position={[1.9, -1.0, -1.1]}
        onClick={(e) => {
          e.stopPropagation();
          avatarController.sit('chair');
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          if (onObjectClick) onObjectClick('chair', e.clientX, e.clientY);
        }}
        onPointerOver={enablePointer}
        onPointerOut={disablePointer}
      >
        {/* Chair Base */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.3]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Five legs */}
        <mesh position={[0, 0.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.5]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        {/* Seat */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.55, 0.08, 0.55]} />
          <meshStandardMaterial color="#a855f7" roughness={0.4} />
        </mesh>
        {/* Backrest (placed at +Z relative to seat center since chair faces -Z) */}
        <mesh position={[0, 0.95, 0.23]} castShadow>
          <boxGeometry args={[0.5, 0.9, 0.08]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.95, 0.22]}>
          <boxGeometry args={[0.4, 0.8, 0.082]} />
          <meshStandardMaterial color="#a855f7" />
        </mesh>
      </group>

      {/* ================= COFFEE TABLE (CENTER FRONT) ================= */}
      <group position={[0, -1.0, 1.3]}>
        {/* Table top */}
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.04, 0.8]} />
          <meshStandardMaterial color="#2b1a0e" roughness={0.3} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.35, 0.15, -0.35]} castShadow>
          <boxGeometry args={[0.05, 0.3, 0.05]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0.35, 0.15, -0.35]} castShadow>
          <boxGeometry args={[0.05, 0.3, 0.05]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[-0.35, 0.15, 0.35]} castShadow>
          <boxGeometry args={[0.05, 0.3, 0.05]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0.35, 0.15, 0.35]} castShadow>
          <boxGeometry args={[0.05, 0.3, 0.05]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Coffee Mug */}
        <group 
          position={[0.1, 0.32, 0.1]}
          onClick={(e) => {
            e.stopPropagation();
            avatarController.interact('mug');
          }}
          onContextMenu={(e) => {
            e.stopPropagation();
            if (onObjectClick) onObjectClick('mug', e.clientX, e.clientY);
          }}
          onPointerOver={enablePointer}
          onPointerOut={disablePointer}
        >
          <mesh castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.1, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.051, 0]}>
            <cylinderGeometry args={[0.048, 0.048, 0.001, 16]} />
            <meshStandardMaterial color="#4e2b00" />
          </mesh>
          <mesh position={[0.05, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.03, 0.008, 8, 16]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* ================= BOOKSHELF (RIGHT WALL) ================= */}
      <group 
        position={[3.35, -1.0, 1.0]} 
        rotation={[0, -Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          avatarController.interact('book');
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          if (onObjectClick) onObjectClick('bookshelf', e.clientX, e.clientY);
        }}
        onPointerOver={enablePointer}
        onPointerOut={disablePointer}
      >
        {/* Left vertical board */}
        <mesh position={[-0.58, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.04, 2.0, 0.3]} />
          <meshStandardMaterial color="#3a2512" roughness={0.7} />
        </mesh>
        {/* Right vertical board */}
        <mesh position={[0.58, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.04, 2.0, 0.3]} />
          <meshStandardMaterial color="#3a2512" roughness={0.7} />
        </mesh>
        {/* Back board */}
        <mesh position={[0, 1.0, -0.14]} castShadow receiveShadow>
          <boxGeometry args={[1.12, 2.0, 0.02]} />
          <meshStandardMaterial color="#2d1b0c" roughness={0.8} />
        </mesh>
        {/* Bottom shelf */}
        <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.12, 0.04, 0.28]} />
          <meshStandardMaterial color="#3a2512" roughness={0.7} />
        </mesh>
        {/* Shelf 1 */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.12, 0.04, 0.28]} />
          <meshStandardMaterial color="#3a2512" roughness={0.7} />
        </mesh>
        {/* Shelf 2 */}
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.12, 0.04, 0.28]} />
          <meshStandardMaterial color="#3a2512" roughness={0.7} />
        </mesh>
        {/* Shelf 3 */}
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.12, 0.04, 0.28]} />
          <meshStandardMaterial color="#3a2512" roughness={0.7} />
        </mesh>
        {/* Top board */}
        <mesh position={[0, 1.98, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.16, 0.04, 0.3]} />
          <meshStandardMaterial color="#3a2512" roughness={0.7} />
        </mesh>

        {/* Glowing LED strips under shelves */}
        <mesh position={[0, 1.95, 0.1]}>
          <boxGeometry args={[1.1, 0.015, 0.02]} />
          <meshStandardMaterial color="#ff9f43" emissive="#ff9f43" emissiveIntensity={2.0} />
        </mesh>
        <mesh position={[0, 1.47, 0.1]}>
          <boxGeometry args={[1.1, 0.015, 0.02]} />
          <meshStandardMaterial color="#ff9f43" emissive="#ff9f43" emissiveIntensity={2.0} />
        </mesh>
        <mesh position={[0, 0.97, 0.1]}>
          <boxGeometry args={[1.1, 0.015, 0.02]} />
          <meshStandardMaterial color="#ff9f43" emissive="#ff9f43" emissiveIntensity={2.0} />
        </mesh>
        <mesh position={[0, 0.47, 0.1]}>
          <boxGeometry args={[1.1, 0.015, 0.02]} />
          <meshStandardMaterial color="#ff9f43" emissive="#ff9f43" emissiveIntensity={2.0} />
        </mesh>

        {/* Books on Shelf 1 */}
        <group position={[-0.3, 0.67, 0.05]}>
          <mesh position={[0, 0, 0]} castShadow><boxGeometry args={[0.08, 0.3, 0.18]} /><meshStandardMaterial color="#ef4444" /></mesh>
          <mesh position={[0.09, 0, 0]} castShadow><boxGeometry args={[0.06, 0.33, 0.18]} /><meshStandardMaterial color="#3b82f6" /></mesh>
          <mesh position={[0.16, 0, 0]} rotation={[0, 0, -0.1]} castShadow><boxGeometry args={[0.07, 0.28, 0.18]} /><meshStandardMaterial color="#10b981" /></mesh>
        </group>
        {/* Books on Shelf 2 */}
        <group position={[0.1, 1.17, 0.05]}>
          <mesh position={[-0.2, 0, 0]} castShadow><boxGeometry args={[0.08, 0.28, 0.18]} /><meshStandardMaterial color="#eab308" /></mesh>
          <mesh position={[-0.1, 0, 0]} castShadow><boxGeometry args={[0.06, 0.31, 0.18]} /><meshStandardMaterial color="#ec4899" /></mesh>
          <mesh position={[0.01, 0, 0]} castShadow><boxGeometry args={[0.08, 0.29, 0.18]} /><meshStandardMaterial color="#6366f1" /></mesh>
        </group>
      </group>

      {/* ================= INDOOR PLANTS ================= */}
      {/* Corner Plant 1 (Back Left Corner) */}
      <group ref={plant1Ref} position={[-2.8, -1.0, -2.5]}>
        {/* Pot */}
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.12, 0.35, 16]} />
          <meshStandardMaterial color="#fff" roughness={0.3} />
        </mesh>
        {/* Plant canopy */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#155724" roughness={0.9} />
        </mesh>
        <mesh position={[-0.1, 0.45, 0.05]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#1a6e30" roughness={0.9} />
        </mesh>
        <mesh position={[0.1, 0.4, -0.05]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#1a6e30" roughness={0.9} />
        </mesh>
      </group>

      {/* Corner Plant 2 (Front Right Corner) */}
      <group ref={plant2Ref} position={[2.8, -1.0, 2.2]}>
        {/* Pot */}
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.14, 0.4, 16]} />
          <meshStandardMaterial color="#5c4033" roughness={0.8} />
        </mesh>
        {/* Plant canopy */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color="#1e5128" roughness={0.9} />
        </mesh>
      </group>

      {/* ================= LEFT WALL PLANT SHELF & FRAMES (ABOVE BED) ================= */}
      <group position={[-3.44, 0.8, -1.0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Shelf Board */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.04, 0.2]} />
          <meshStandardMaterial color="#3a2512" roughness={0.7} />
        </mesh>
        {/* Glowing Pink/Purple LED Strip Under Shelf */}
        <mesh position={[0, -0.025, 0.08]}>
          <boxGeometry args={[1.5, 0.015, 0.02]} />
          <meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={2.5} />
        </mesh>
        {/* Potted Plant 1 on shelf */}
        <group position={[-0.4, 0.12, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.04, 0.1, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color="#1e3f20" roughness={0.9} />
          </mesh>
        </group>
        {/* Potted Plant 2 on shelf */}
        <group position={[0.4, 0.12, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.04, 0.1, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color="#1e3f20" roughness={0.9} />
          </mesh>
        </group>
      </group>

      {/* Three Bedroom Wall Picture Frames (Left Wall under the shelf) */}
      <group position={[-3.44, 0.35, -1.0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Frame 1 */}
        <mesh position={[-0.5, 0, 0]} castShadow>
          <boxGeometry args={[0.35, 0.45, 0.015]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[-0.5, 0, 0.009]}>
          <planeGeometry args={[0.31, 0.41]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.6} />
        </mesh>

        {/* Frame 2 */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.35, 0.45, 0.015]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, 0, 0.009]}>
          <planeGeometry args={[0.31, 0.41]} />
          <meshStandardMaterial color="#52525b" roughness={0.6} />
        </mesh>

        {/* Frame 3 */}
        <mesh position={[0.5, 0, 0]} castShadow>
          <boxGeometry args={[0.35, 0.45, 0.015]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0.5, 0, 0.009]}>
          <planeGeometry args={[0.31, 0.41]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.6} />
        </mesh>
      </group>

      {/* ================= SMART LED STRIP (Ceiling Edge) ================= */}
      {/* Back edge */}
      <mesh ref={ledStripRef} position={[0, 1.97, -2.95]}>
        <boxGeometry args={[7, 0.04, 0.04]} />
        <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={1.2} />
      </mesh>
      {/* Left edge */}
      <mesh position={[-3.47, 1.97, 0]}>
        <boxGeometry args={[0.04, 0.04, 6]} />
        <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={1.0} />
      </mesh>
      {/* Right edge */}
      <mesh position={[3.47, 1.97, 0]}>
        <boxGeometry args={[0.04, 0.04, 6]} />
        <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={1.0} />
      </mesh>

      {/* ================= AI GADGET (On Desk) ================= */}
      <group position={[2.0, -0.28, -1.1]}>
        {/* Holographic sphere */}
        <mesh ref={aiGadgetRef} position={[0, 0.78, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color={ledColor}
            emissive={ledColor}
            emissiveIntensity={2.0}
            transparent
            opacity={0.8}
          />
        </mesh>
        {/* Base ring */}
        <mesh position={[0, 0.73, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.05, 0.008, 8, 24]} />
          <meshStandardMaterial color="#333" metalness={0.9} />
        </mesh>
        {/* Base cylinder */}
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.02, 16]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} />
        </mesh>
      </group>

      {/* ================= WALL CLOCK (Left Wall) ================= */}
      <group position={[-3.44, 1.0, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        {/* Clock face */}
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, 0.02, 24]} />
          <meshStandardMaterial color="#111" metalness={0.5} />
        </mesh>
        {/* Clock face plate */}
        <mesh position={[0, 0, 0.011]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.18, 24]} />
          <meshStandardMaterial color="#1e1e30" />
        </mesh>
        {/* Clock ring */}
        <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.19, 24]} />
          <meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  );
}
