import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AVATAR_CONFIG } from '../config/avatarConfig';
import { avatarController } from '../controllers/AvatarController';

export function useEyeTracking(vrm) {
  // Store targets and current angles
  const currentHeadYaw = useRef(0);
  const currentHeadPitch = useRef(0);
  const currentEyeYaw = useRef(0);
  const currentEyePitch = useRef(0);

  // Saccade (micro-movement) offset
  const saccadeYaw = useRef(0);
  const saccadePitch = useRef(0);
  const nextSaccadeTime = useRef(0);

  // Blink tracking
  const nextBlinkTime = useRef(0);
  const blinkVal = useRef(0);
  const blinkPhase = useRef('idle'); // 'idle', 'closing', 'opening'
  
  const cursorNearTime = useRef(0);
  const waveTriggered = useRef(false);

  useFrame((state, delta) => {
    if (!vrm) return;

    const config = AVATAR_CONFIG.eyeTracking;
    const idleConfig = AVATAR_CONFIG.idle;

    // --- SACCADES (Micro Eye Movements) ---
    const now = state.clock.getElapsedTime();
    if (now > nextSaccadeTime.current) {
      // Set new random micro-deviation
      const angle = Math.random() * Math.PI * 2;
      const mag = Math.random() * config.saccadeMagnitude;
      saccadeYaw.current = Math.cos(angle) * mag;
      saccadePitch.current = Math.sin(angle) * mag;
      
      // Schedule next saccade
      nextSaccadeTime.current = now + THREE.MathUtils.randFloat(
        config.saccadeIntervalMin,
        config.saccadeIntervalMax
      );
    }

    // --- TARGET DETERMINATION ---
    // Look target is stored in avatarController
    let target = avatarController.lookTarget;

    // If mouse following is active, overwrite target with mouse projection
    if (config.enabled) {
      // Project mouse (-1 to 1) into a 3D coordinate in front of the camera
      const mouseX = state.pointer.x * 2.0; // scale up slightly for sensitivity
      const mouseY = state.pointer.y * 1.5 + 1.3; // offset to face height
      target = new THREE.Vector3(mouseX, mouseY, 2.0);

      // --- Cursor Proximity Interactions ---
      const distToCenter = Math.sqrt(state.pointer.x * state.pointer.x + state.pointer.y * state.pointer.y);
      if (distToCenter < 0.35) {
        if (avatarController.emotion === 'neutral') {
          avatarController.setEmotion('happy');
        }
        cursorNearTime.current += delta;
        if (cursorNearTime.current > 4.0 && !waveTriggered.current) {
          avatarController.currentAction = 'wave';
          waveTriggered.current = true;
        }
      } else {
        cursorNearTime.current = 0;
        waveTriggered.current = false;
        if (avatarController.emotion === 'happy' && avatarController.inactivityTime < 30) {
          avatarController.setEmotion('neutral');
        }
      }
    }

    // --- ROTATION CALCULATIONS ---
    const headNode = vrm.humanoid?.getNormalizedBoneNode('head');
    const neckNode = vrm.humanoid?.getNormalizedBoneNode('neck');
    const leftEyeNode = vrm.humanoid?.getNormalizedBoneNode('leftEye');
    const rightEyeNode = vrm.humanoid?.getNormalizedBoneNode('rightEye');

    if (headNode) {
      // Get world position of head
      const headWorldPos = new THREE.Vector3();
      headNode.getWorldPosition(headWorldPos);

      // Compute direction from head to target
      const dir = new THREE.Vector3().subVectors(target, headWorldPos).normalize();

      // Calculate yaw (horizontal) and pitch (vertical) rotation angles
      // In Three.js standard coordinates:
      // Yaw is rotation around Y axis (look left/right)
      // Pitch is rotation around X axis (look up/down)
      let yaw = Math.atan2(-dir.x, dir.z);
      let pitch = Math.atan2(dir.y, Math.sqrt(dir.x * dir.x + dir.z * dir.z));

      // Clamp yaw/pitch to maximum ranges
      const clampedHeadYaw = THREE.MathUtils.clamp(yaw, -config.maxHeadRotation, config.maxHeadRotation);
      const clampedHeadPitch = THREE.MathUtils.clamp(pitch, -config.maxHeadRotation, config.maxHeadRotation);

      const clampedEyeYaw = THREE.MathUtils.clamp(yaw - clampedHeadYaw, -config.maxEyeRotation, config.maxEyeRotation);
      const clampedEyePitch = THREE.MathUtils.clamp(pitch - clampedHeadPitch, -config.maxEyeRotation, config.maxEyeRotation);

      // Smoothly interpolate current angles towards targets
      const lerpFactor = THREE.MathUtils.clamp(delta * config.lerpSpeed, 0, 1);
      
      currentHeadYaw.current = THREE.MathUtils.lerp(currentHeadYaw.current, clampedHeadYaw, lerpFactor);
      currentHeadPitch.current = THREE.MathUtils.lerp(currentHeadPitch.current, clampedHeadPitch, lerpFactor);
      
      // Eyes include saccadic micro-movements
      currentEyeYaw.current = THREE.MathUtils.lerp(
        currentEyeYaw.current, 
        clampedEyeYaw + saccadeYaw.current, 
        lerpFactor * 1.5
      );
      currentEyePitch.current = THREE.MathUtils.lerp(
        currentEyePitch.current, 
        clampedEyePitch + saccadePitch.current, 
        lerpFactor * 1.5
      );

      // --- APPLY ROTATIONS TO BONES ---
      // Head bone takes about 60% of head rotation, Neck takes 40%
      if (neckNode) {
        neckNode.rotation.y = currentHeadYaw.current * 0.4;
        neckNode.rotation.x = currentHeadPitch.current * 0.4;
      }
      headNode.rotation.y = currentHeadYaw.current * 0.6;
      headNode.rotation.x = currentHeadPitch.current * 0.6;

      // Apply rotations to eye bones
      if (leftEyeNode && rightEyeNode) {
        leftEyeNode.rotation.y = currentEyeYaw.current;
        leftEyeNode.rotation.x = currentEyePitch.current;
        
        rightEyeNode.rotation.y = currentEyeYaw.current;
        rightEyeNode.rotation.x = currentEyePitch.current;
      } else if (vrm.lookAt) {
        // Fallback to standard LookAt engine if eye bones aren't mapped
        vrm.lookAt.lookAt(target);
      }
    }

    // --- BLINK ENGINE ---
    const manager = vrm.expressionManager;
    if (manager) {
      // Manual blink override from controller
      if (avatarController.blinkTriggered) {
        avatarController.blinkTriggered = false;
        blinkPhase.current = 'closing';
      }

      // Check random blink scheduling
      if (blinkPhase.current === 'idle' && now > nextBlinkTime.current) {
        blinkPhase.current = 'closing';
      }

      // Blink animation state machine
      const blinkSpeed = delta / idleConfig.blinkDuration;
      if (blinkPhase.current === 'closing') {
        blinkVal.current += blinkSpeed * 2.5; // close quickly
        if (blinkVal.current >= 1.0) {
          blinkVal.current = 1.0;
          blinkPhase.current = 'opening';
        }
      } else if (blinkPhase.current === 'opening') {
        blinkVal.current -= blinkSpeed * 1.5; // open slightly slower
        if (blinkVal.current <= 0) {
          blinkVal.current = 0;
          blinkPhase.current = 'idle';
          // Schedule next blink
          nextBlinkTime.current = now + THREE.MathUtils.randFloat(
            idleConfig.blinkIntervalMin,
            idleConfig.blinkIntervalMax
          );
        }
      }

      // Set morph values
      if (avatarController.emotion === 'sleeping') {
        manager.setValue('blinkLeft', 1.0);
        manager.setValue('blinkRight', 1.0);
      } else {
        manager.setValue('blinkLeft', blinkVal.current);
        manager.setValue('blinkRight', blinkVal.current);
      }
    }
  });
}
