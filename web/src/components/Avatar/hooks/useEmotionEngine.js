import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AVATAR_CONFIG } from '../config/avatarConfig';
import { avatarController } from '../controllers/AvatarController';

// Detailed blend shape emotion mapping matrices
const EMOTION_PROPERTIES = {
  neutral: { happy: 0, sad: 0, angry: 0, surprised: 0, relaxed: 0 },
  happy: { happy: 0.8, sad: 0, angry: 0, surprised: 0, relaxed: 0.3 },
  excited: { happy: 1.0, sad: 0, angry: 0, surprised: 0.4, relaxed: 0.2 },
  thinking: { happy: 0, sad: 0.15, angry: 0, surprised: 0, relaxed: 0.4 },
  curious: { happy: 0.2, sad: 0, angry: 0, surprised: 0.5, relaxed: 0.3 },
  listening: { happy: 0.1, sad: 0, angry: 0, surprised: 0, relaxed: 0.6 },
  talking: { happy: 0.3, sad: 0, angry: 0, surprised: 0, relaxed: 0.4 },
  sleeping: { happy: 0, sad: 0, angry: 0, surprised: 0, relaxed: 0.8 },
  waiting: { happy: 0, sad: 0.2, angry: 0, surprised: 0, relaxed: 0.5 },
  confused: { happy: 0, sad: 0.3, angry: 0, surprised: 0.4, relaxed: 0.2 },
  sad: { happy: 0, sad: 0.85, angry: 0, surprised: 0, relaxed: 0 },
  angry: { happy: 0, sad: 0, angry: 0.9, surprised: 0, relaxed: 0 },
  shy: { happy: 0.6, sad: 0.1, angry: 0, surprised: 0, relaxed: 0.4 },
  love: { happy: 0.9, sad: 0, angry: 0, surprised: 0, relaxed: 0.5 },
  celebration: { happy: 1.0, sad: 0, angry: 0, surprised: 0.3, relaxed: 0.2 }
};

export function useEmotionEngine(vrm) {
  // Store current running values of the morph targets for smooth transition
  const currentValuesRef = useRef({
    happy: 0,
    sad: 0,
    angry: 0,
    surprised: 0,
    relaxed: 0,
  });

  useFrame((state, delta) => {
    if (!vrm || !vrm.expressionManager) return;

    const manager = vrm.expressionManager;
    const activeEmotion = avatarController.emotion;
    const targets = EMOTION_PROPERTIES[activeEmotion] || EMOTION_PROPERTIES.neutral;
    const lerpFactor = THREE.MathUtils.clamp(delta * AVATAR_CONFIG.emotions.transitionSpeed, 0, 1);

    // Smoothly interpolate each expression
    Object.keys(targets).forEach((key) => {
      const targetVal = targets[key];
      const currentVal = currentValuesRef.current[key];
      const nextVal = THREE.MathUtils.lerp(currentVal, targetVal, lerpFactor);
      
      currentValuesRef.current[key] = nextVal;

      // Apply to VRM expression manager
      // Under VRM 1.0, presets are uppercase/lowercase depending on loaded VRM version,
      // ExpressionManager handles lowercase standard preset keys
      manager.setValue(key, nextVal);
    });
  });
}
