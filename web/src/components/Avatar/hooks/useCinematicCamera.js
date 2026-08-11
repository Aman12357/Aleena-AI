import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { avatarController } from '../controllers/AvatarController';

export function useCinematicCamera() {
  const currentLookTarget = useRef(new THREE.Vector3(0, 0.35, 0));

  useFrame((state, delta) => {
    const camera = state.camera;
    const lerpSpeed = delta * 3.5;

    // Get current coordinates of avatar
    const aPos = avatarController.worldPosition;
    
    // Define base target coordinates for camera
    const targetCamPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();

    // Determine camera state
    if (avatarController.isLyingDown || avatarController.emotion === 'sleeping') {
      // Camera focused on sleeping bed
      targetCamPos.set(-0.8, 0.1, 0.4);
      targetLookAt.set(-1.6, -0.4, -0.8);
    } else if (avatarController.isSitting) {
      // Camera focused on desk/chair
      targetCamPos.set(0.6, 0.3, 0.6);
      targetLookAt.set(1.5, 0.05, -0.3);
    } else if (avatarController.isWalking) {
      // High/Wide follow camera showing movement
      targetCamPos.set(aPos.x * 0.4, 0.7, aPos.z + 1.8);
      targetLookAt.set(aPos.x, aPos.y + 0.6, aPos.z);
    } else if (avatarController.talking) {
      // Closer talking headshot
      targetCamPos.set(aPos.x, aPos.y + 1.35, aPos.z + 0.8);
      targetLookAt.set(aPos.x, aPos.y + 1.3, aPos.z);
    } else {
      // Default idle look
      targetCamPos.set(aPos.x, aPos.y + 1.35, aPos.z + 1.15);
      targetLookAt.set(aPos.x, aPos.y + 1.25, aPos.z);
    }

    // Interpolate camera position
    camera.position.lerp(targetCamPos, lerpSpeed);

    // Interpolate lookAt target
    currentLookTarget.current.lerp(targetLookAt, lerpSpeed);
    camera.lookAt(currentLookTarget.current);
  });

  return null;
}
