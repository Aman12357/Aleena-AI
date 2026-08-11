import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AVATAR_CONFIG } from '../config/avatarConfig';
import { avatarController } from '../controllers/AvatarController';

export function useAvatarAnimation(vrm) {
  // Keep track of active procedural gesture animations
  const gestureState = useRef({
    name: null,      // Name of active gesture: 'nod', 'shake', 'wave', 'dance', 'stretch', 'jump', 'spin'
    startTime: 0,
    duration: 0,
    phase: 0,
  });

  // Track original posture rotations to prevent permanent displacement
  const originalRotations = useRef({
    leftShoulder: new THREE.Euler(),
    rightShoulder: new THREE.Euler(),
    leftUpperArm: new THREE.Euler(),
    rightUpperArm: new THREE.Euler(),
    leftLowerArm: new THREE.Euler(),
    rightLowerArm: new THREE.Euler(),
    leftUpperLeg: new THREE.Euler(),
    rightUpperLeg: new THREE.Euler(),
    leftLowerLeg: new THREE.Euler(),
    rightLowerLeg: new THREE.Euler(),
  });

  const initialized = useRef(false);

  const hasSpoken30 = useRef(false);
  const hasSpoken60 = useRef(false);
  const hasSpoken120 = useRef(false);

  useEffect(() => {
    const resetTimer = () => {
      // If we are asleep or sitting, reset to idle when boss returns
      if (avatarController.inactivityTime >= 30) {
        avatarController.setEmotion('happy');
        avatarController.navigateTo('center');
        avatarController.currentAction = 'wave';
        avatarController.sendSpeech("Yay! Boss aa gaye! 😄\nMain to bas aapka hi wait kar rahi thi.");
        
        hasSpoken30.current = false;
        hasSpoken60.current = false;
        hasSpoken120.current = false;
      }
      avatarController.inactivityTime = 0;
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, []);

  useFrame((state, delta) => {
    if (!vrm) return;

    // --- INITIALIZE INITIAL BONE ROTATIONS ---
    const spine = vrm.humanoid?.getNormalizedBoneNode('spine');
    const chest = vrm.humanoid?.getNormalizedBoneNode('chest');
    const leftShoulder = vrm.humanoid?.getNormalizedBoneNode('leftShoulder');
    const rightShoulder = vrm.humanoid?.getNormalizedBoneNode('rightShoulder');
    const leftUpperArm = vrm.humanoid?.getNormalizedBoneNode('leftUpperArm');
    const rightUpperArm = vrm.humanoid?.getNormalizedBoneNode('rightUpperArm');
    const leftLowerArm = vrm.humanoid?.getNormalizedBoneNode('leftLowerArm');
    const rightLowerArm = vrm.humanoid?.getNormalizedBoneNode('rightLowerArm');
    
    const leftUpperLeg = vrm.humanoid?.getNormalizedBoneNode('leftUpperLeg');
    const rightUpperLeg = vrm.humanoid?.getNormalizedBoneNode('rightUpperLeg');
    const leftLowerLeg = vrm.humanoid?.getNormalizedBoneNode('leftLowerLeg');
    const rightLowerLeg = vrm.humanoid?.getNormalizedBoneNode('rightLowerLeg');

    const headNode = vrm.humanoid?.getNormalizedBoneNode('head');
    const neckNode = vrm.humanoid?.getNormalizedBoneNode('neck');

    if (!initialized.current) {
      if (leftShoulder) originalRotations.current.leftShoulder.copy(leftShoulder.rotation);
      if (rightShoulder) originalRotations.current.rightShoulder.copy(rightShoulder.rotation);
      if (leftUpperArm) originalRotations.current.leftUpperArm.copy(leftUpperArm.rotation);
      if (rightUpperArm) originalRotations.current.rightUpperArm.copy(rightUpperArm.rotation);
      if (leftLowerArm) originalRotations.current.leftLowerArm.copy(leftLowerArm.rotation);
      if (rightLowerArm) originalRotations.current.rightLowerArm.copy(rightLowerArm.rotation);
      if (leftUpperLeg) originalRotations.current.leftUpperLeg.copy(leftUpperLeg.rotation);
      if (rightUpperLeg) originalRotations.current.rightUpperLeg.copy(rightUpperLeg.rotation);
      if (leftLowerLeg) originalRotations.current.leftLowerLeg.copy(leftLowerLeg.rotation);
      if (rightLowerLeg) originalRotations.current.rightLowerLeg.copy(rightLowerLeg.rotation);
      initialized.current = true;
    }

    const t = state.clock.getElapsedTime();
    const idle = AVATAR_CONFIG.idle;
    const activeEmotion = avatarController.emotion;

    // --- EMOTION-BASED BREATHING SPEED & AMPLITUDE ---
    let emotionBreatheSpeed = idle.breathingSpeed;
    let emotionBreatheAmp = idle.breathingAmplitude;
    let spineXOffset = 0;
    let spineZOffset = 0;

    if (activeEmotion === 'angry') {
      emotionBreatheSpeed = 3.2;
      emotionBreatheAmp = 0.035; // Heavy/puffed breathing
      spineXOffset = -0.04;      // Lean forward aggressively
    } else if (activeEmotion === 'sad') {
      emotionBreatheSpeed = 0.9;
      emotionBreatheAmp = 0.007; // Very shallow breathing
      spineXOffset = 0.06;       // Slouch forward
    } else if (activeEmotion === 'sleeping') {
      emotionBreatheSpeed = 0.7;
      emotionBreatheAmp = 0.011; // Slow deep sleep breathing
    } else if (activeEmotion === 'excited' || activeEmotion === 'celebration') {
      emotionBreatheSpeed = 2.4;
      emotionBreatheAmp = 0.024;
      spineXOffset = -0.02;
      spineZOffset = Math.sin(t * 3.5) * 0.02; // Happy bounce
    } else if (activeEmotion === 'shy') {
      spineXOffset = 0.03;       // Slightly slouched/timid
    }

    const breatheCycle = t * emotionBreatheSpeed;
    const breatheOffset = Math.sin(breatheCycle) * emotionBreatheAmp;
    const breatheChestOffset = Math.cos(breatheCycle) * emotionBreatheAmp * 0.7;

    // Apply breathing and posture to spine and chest
    if (spine) {
      spine.rotation.x = breatheOffset + spineXOffset;
      spine.rotation.z = Math.sin(t * 0.3) * 0.015 + spineZOffset;
    }
    if (chest) {
      chest.rotation.x = breatheChestOffset;
    }

    // Apply breathing to shoulders
    if (leftShoulder) {
      leftShoulder.rotation.z = originalRotations.current.leftShoulder.z + breatheOffset * 0.3;
    }
    if (rightShoulder) {
      rightShoulder.rotation.z = originalRotations.current.rightShoulder.z - breatheOffset * 0.3;
    }

    // Apply head posture tilt offsets based on active emotion
    if (headNode) {
      if (activeEmotion === 'sad') {
        headNode.rotation.x += 0.22; // Head down
      } else if (activeEmotion === 'angry') {
        headNode.rotation.x -= 0.12; // Glaring head tilt
      } else if (activeEmotion === 'thinking') {
        headNode.rotation.z += 0.15; // Curious head tilt
      } else if (activeEmotion === 'curious') {
        headNode.rotation.z -= 0.15; // Side head tilt
      } else if (activeEmotion === 'shy') {
        headNode.rotation.x += 0.12; // Look down
        headNode.rotation.y -= 0.14; // Face turned away
      } else if (activeEmotion === 'love') {
        headNode.rotation.z += Math.sin(t * 1.5) * 0.06; // Coy head sway
      } else if (activeEmotion === 'excited' || activeEmotion === 'celebration') {
        headNode.rotation.y += Math.sin(t * 5.0) * 0.04; // Giggling/bobbing
      }
    }

    // --- PROCEDURAL GESTURE SYSTEM ---
    if (avatarController.currentAction === 'wave' && gestureState.current.name !== 'wave') {
      gestureState.current = { name: 'wave', startTime: t, duration: 2.0, phase: 0 };
      avatarController.currentAction = null;
    } else if (avatarController.currentAction === 'nod' && gestureState.current.name !== 'nod') {
      gestureState.current = { name: 'nod', startTime: t, duration: 1.2, phase: 0 };
      avatarController.currentAction = null;
    } else if (avatarController.currentAction === 'shake' && gestureState.current.name !== 'shake') {
      gestureState.current = { name: 'shake', startTime: t, duration: 1.2, phase: 0 };
      avatarController.currentAction = null;
    } else if (avatarController.currentAction === 'dance' && gestureState.current.name !== 'dance') {
      gestureState.current = { name: 'dance', startTime: t, duration: 4.0, phase: 0 };
      avatarController.currentAction = null;
    } else if (avatarController.currentAction === 'stretch' && gestureState.current.name !== 'stretch') {
      gestureState.current = { name: 'stretch', startTime: t, duration: 2.5, phase: 0 };
      avatarController.currentAction = null;
    } else if (avatarController.currentAction === 'jump' && gestureState.current.name !== 'jump') {
      gestureState.current = { name: 'jump', startTime: t, duration: 1.2, phase: 0 };
      avatarController.currentAction = null;
    } else if (avatarController.currentAction === 'spin' && gestureState.current.name !== 'spin') {
      gestureState.current = { name: 'spin', startTime: t, duration: 1.5, phase: 0 };
      avatarController.currentAction = null;
    }

    const gesture = gestureState.current;
    if (gesture.name) {
      const elapsed = t - gesture.startTime;
      const progress = elapsed / gesture.duration;

      if (progress >= 1.0) {
        // Reset bones to default
        if (leftUpperArm) leftUpperArm.rotation.copy(originalRotations.current.leftUpperArm);
        if (leftLowerArm) leftLowerArm.rotation.copy(originalRotations.current.leftLowerArm);
        if (rightUpperArm) rightUpperArm.rotation.copy(originalRotations.current.rightUpperArm);
        if (rightLowerArm) rightLowerArm.rotation.copy(originalRotations.current.rightLowerArm);
        
        avatarController.onGestureComplete();
        gesture.name = null;
      } else {
        const envelope = Math.sin(progress * Math.PI);

        if (gesture.name === 'wave') {
          if (rightUpperArm && rightLowerArm) {
            rightUpperArm.rotation.z = THREE.MathUtils.lerp(originalRotations.current.rightUpperArm.z, -Math.PI / 3, envelope);
            rightUpperArm.rotation.x = THREE.MathUtils.lerp(originalRotations.current.rightUpperArm.x, -Math.PI / 6, envelope);
            const waveFreq = 12;
            const waveAngle = Math.sin(elapsed * waveFreq) * 0.35;
            rightLowerArm.rotation.y = THREE.MathUtils.lerp(originalRotations.current.rightLowerArm.y, Math.PI / 4 + waveAngle, envelope);
          }
        } else if (gesture.name === 'nod') {
          if (headNode) {
            const nodFreq = 10;
            const nodAngle = Math.sin(elapsed * nodFreq) * 0.15;
            headNode.rotation.x += nodAngle * envelope;
          }
        } else if (gesture.name === 'shake') {
          if (headNode) {
            const shakeFreq = 10;
            const shakeAngle = Math.sin(elapsed * shakeFreq) * 0.18;
            headNode.rotation.y += shakeAngle * envelope;
          }
        } else if (gesture.name === 'dance') {
          const bounce = Math.abs(Math.sin(elapsed * 8)) * 0.12;
          vrm.scene.position.y = -0.9 + bounce;
          if (leftUpperArm && rightUpperArm && spine) {
            spine.rotation.z = Math.sin(elapsed * 8) * 0.15;
            leftUpperArm.rotation.z = THREE.MathUtils.lerp(originalRotations.current.leftUpperArm.z, 1.2 + Math.sin(elapsed * 8) * 0.3, envelope);
            rightUpperArm.rotation.z = THREE.MathUtils.lerp(originalRotations.current.rightUpperArm.z, -1.2 + Math.cos(elapsed * 8) * 0.3, envelope);
          }
        } else if (gesture.name === 'stretch') {
          if (leftUpperArm && rightUpperArm && headNode) {
            leftUpperArm.rotation.z = THREE.MathUtils.lerp(originalRotations.current.leftUpperArm.z, 2.8, envelope);
            leftUpperArm.rotation.x = THREE.MathUtils.lerp(originalRotations.current.leftUpperArm.x, -0.2, envelope);
            rightUpperArm.rotation.z = THREE.MathUtils.lerp(originalRotations.current.rightUpperArm.z, -2.8, envelope);
            rightUpperArm.rotation.x = THREE.MathUtils.lerp(originalRotations.current.rightUpperArm.x, -0.2, envelope);
            headNode.rotation.x = THREE.MathUtils.lerp(headNode.rotation.x, -0.2, envelope);
          }
        } else if (gesture.name === 'jump') {
          let jumpY = -0.9;
          if (progress < 0.2) {
            jumpY = THREE.MathUtils.lerp(-0.9, -1.05, progress / 0.2);
          } else if (progress < 0.8) {
            const airProgress = (progress - 0.2) / 0.6;
            jumpY = -0.9 + Math.sin(airProgress * Math.PI) * 0.5;
          } else {
            const landProgress = (progress - 0.8) / 0.4;
            jumpY = THREE.MathUtils.lerp(-1.05, -0.9, landProgress);
          }
          vrm.scene.position.y = jumpY;
        } else if (gesture.name === 'spin') {
          vrm.scene.rotation.y = avatarController.worldRotation + progress * Math.PI * 2.0;
        }
      }
    }

    // --- INACTIVITY & LOCOMOTION SYSTEM ---
    if (!avatarController.followMode) {
      avatarController.inactivityTime += delta;
    }
    const inactiveSec = avatarController.inactivityTime;

    if (inactiveSec >= 120.0) {
      if (!hasSpoken120.current) {
        avatarController.setEmotion('sleeping');
        avatarController.navigateTo('bed', 'lying');
        avatarController.sendSpeech("Boss... lagta hai aap busy ho... 😴\nMain thodi der ke liye so jaati hoon...\nJaldi aa jana... warna mujhe aapki yaad aayegi. ❤️");
        hasSpoken120.current = true;
      }
    } else if (inactiveSec >= 60.0) {
      if (!hasSpoken60.current) {
        avatarController.setEmotion('waiting');
        avatarController.navigateTo('desk', 'sitting');
        avatarController.sendSpeech("Waiting for you is my favorite job... but don't take forever. 😊");
        hasSpoken60.current = true;
      }
    } else if (inactiveSec >= 30.0) {
      if (!hasSpoken30.current) {
        avatarController.setEmotion('waiting');
        avatarController.navigateTo('window');
        avatarController.sendSpeech("Boss... where did you disappear? 🥺");
        hasSpoken30.current = true;
      }
    }

    const lerpSpeed = delta * 3.5;

    // Apply walk, sit, lie or standing height + rotations
    if (avatarController.isWalking) {
      const walkCycle = t * 6.5;
      vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, -0.9, lerpSpeed);
      vrm.scene.rotation.x = THREE.MathUtils.lerp(vrm.scene.rotation.x, 0, lerpSpeed);

      // Procedural walking legs cycle
      if (leftUpperLeg) leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, Math.sin(walkCycle) * 0.4, lerpSpeed);
      if (rightUpperLeg) rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, -Math.sin(walkCycle) * 0.4, lerpSpeed);
      if (leftLowerLeg) leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, (Math.cos(walkCycle + Math.PI) + 1.0) * 0.35, lerpSpeed);
      if (rightLowerLeg) rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, (Math.cos(walkCycle) + 1.0) * 0.35, lerpSpeed);

      // Arm swing
      if (leftUpperArm) {
        leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -Math.sin(walkCycle) * 0.3, lerpSpeed);
        leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.2, lerpSpeed);
      }
      if (rightUpperArm) {
        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, Math.sin(walkCycle) * 0.3, lerpSpeed);
        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.2, lerpSpeed);
      }
      if (spine) spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, Math.sin(walkCycle * 2.0) * 0.05 + breatheOffset, lerpSpeed);
    } 
    
    else if (avatarController.isSitting) {
      // Dynamic height depending on furniture location
      const aPos = avatarController.worldPosition;
      let seatY = -1.38; // Default desk chair
      if (aPos.x < -1.0 && aPos.z < 0) seatY = -1.28; // bed edge
      if (aPos.x < -1.0 && aPos.z > 0.8) seatY = -1.35; // sofa

      vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, seatY, lerpSpeed);
      vrm.scene.rotation.x = THREE.MathUtils.lerp(vrm.scene.rotation.x, 0, lerpSpeed);

      // Hips/Knees bent 90 degrees
      if (leftUpperLeg) leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, -Math.PI / 2.2, lerpSpeed);
      if (rightUpperLeg) rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, -Math.PI / 2.2, lerpSpeed);
      if (leftLowerLeg) leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, Math.PI / 2.2, lerpSpeed);
      if (rightLowerLeg) rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, Math.PI / 2.2, lerpSpeed);

      // Rest arms on desk/lap
      if (leftUpperArm) {
        leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, 0.2, lerpSpeed);
        leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.4, lerpSpeed);
      }
      if (rightUpperArm) {
        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, 0.2, lerpSpeed);
        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.4, lerpSpeed);
      }
    } 
    
    else if (avatarController.isLyingDown) {
      // Lie flat position offset (on top of bed mattress)
      vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, -0.55, lerpSpeed);
      vrm.scene.rotation.x = THREE.MathUtils.lerp(vrm.scene.rotation.x, -Math.PI / 2.0, lerpSpeed); // Rotated flat on back

      // Legs straight
      if (leftUpperLeg) leftUpperLeg.rotation.copy(originalRotations.current.leftUpperLeg);
      if (rightUpperLeg) rightUpperLeg.rotation.copy(originalRotations.current.rightUpperLeg);
      if (leftLowerLeg) leftLowerLeg.rotation.copy(originalRotations.current.leftLowerLeg);
      if (rightLowerLeg) rightLowerLeg.rotation.copy(originalRotations.current.rightLowerLeg);

      // Arm restful sides
      if (leftUpperArm) {
        leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, 0.05, lerpSpeed);
        leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.1, lerpSpeed);
      }
      if (rightUpperArm) {
        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, 0.05, lerpSpeed);
        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.1, lerpSpeed);
      }
    } 
    
    else {
      // Standing height (feet rest on floor Y = -0.9)
      vrm.scene.position.y = THREE.MathUtils.lerp(vrm.scene.position.y, -0.9, lerpSpeed);
      vrm.scene.rotation.x = THREE.MathUtils.lerp(vrm.scene.rotation.x, 0, lerpSpeed);

      // Reset legs to default stance
      if (leftUpperLeg) leftUpperLeg.rotation.copy(originalRotations.current.leftUpperLeg);
      if (rightUpperLeg) rightUpperLeg.rotation.copy(originalRotations.current.rightUpperLeg);
      if (leftLowerLeg) leftLowerLeg.rotation.copy(originalRotations.current.leftLowerLeg);
      if (rightLowerLeg) rightLowerLeg.rotation.copy(originalRotations.current.rightLowerLeg);

      // --- PROCEDURAL INTERACTION POSES ---
      if (avatarController.interactObject === 'book') {
        // Holding a book in front
        if (leftUpperArm) {
          leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -Math.PI / 4.5, lerpSpeed);
          leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.5, lerpSpeed);
        }
        if (rightUpperArm) {
          rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -Math.PI / 4.5, lerpSpeed);
          rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.5, lerpSpeed);
        }
        if (leftLowerArm) leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, 0.5, lerpSpeed);
        if (rightLowerArm) rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, -0.5, lerpSpeed);
      } else if (avatarController.interactObject === 'mug') {
        // Drinking from a mug (raising right hand to mouth)
        if (leftUpperArm) {
          leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, 0.4, lerpSpeed);
          leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 1.25, lerpSpeed);
        }
        if (rightUpperArm) {
          rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -Math.PI / 3.2, lerpSpeed);
          rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.2, lerpSpeed);
        }
        if (leftLowerArm) {
          leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, 0.1, lerpSpeed);
          leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, 0.95, lerpSpeed);
        }
        if (rightLowerArm) {
          rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, 0.6, lerpSpeed);
          rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, -1.1, lerpSpeed);
        }
      } else {
        // Standard clasped hands posture
        if (spine) spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, breatheOffset, lerpSpeed);
        if (chest) chest.rotation.x = THREE.MathUtils.lerp(chest.rotation.x, breatheChestOffset, lerpSpeed);
        
        if (leftShoulder) leftShoulder.rotation.z = THREE.MathUtils.lerp(leftShoulder.rotation.z, originalRotations.current.leftShoulder.z + breatheOffset * 0.3, lerpSpeed);
        if (rightShoulder) rightShoulder.rotation.z = THREE.MathUtils.lerp(rightShoulder.rotation.z, originalRotations.current.rightShoulder.z - breatheOffset * 0.3, lerpSpeed);

        if (leftUpperArm) {
          leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, 0.4, lerpSpeed);
          leftUpperArm.rotation.y = THREE.MathUtils.lerp(leftUpperArm.rotation.y, 0.1, lerpSpeed);
          leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 1.25, lerpSpeed);
        }
        if (rightUpperArm) {
          rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, 0.4, lerpSpeed);
          rightUpperArm.rotation.y = THREE.MathUtils.lerp(rightUpperArm.rotation.y, -0.1, lerpSpeed);
          rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -1.25, lerpSpeed);
        }
        
        if (leftLowerArm) {
          leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, 0.1, lerpSpeed);
          leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, 0.95, lerpSpeed);
          leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, -0.15, lerpSpeed);
        }
        if (rightLowerArm) {
          rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, 0.1, lerpSpeed);
          rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, -0.95, lerpSpeed);
          rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, 0.15, lerpSpeed);
        }

        const leftHand = vrm.humanoid?.getNormalizedBoneNode('leftHand');
        const rightHand = vrm.humanoid?.getNormalizedBoneNode('rightHand');
        if (leftHand) {
          leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, 0.1, lerpSpeed);
          leftHand.rotation.y = THREE.MathUtils.lerp(leftHand.rotation.y, 0.25, lerpSpeed);
          leftHand.rotation.z = THREE.MathUtils.lerp(leftHand.rotation.z, 0.35, lerpSpeed);
        }
        if (rightHand) {
          rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, 0.1, lerpSpeed);
          rightHand.rotation.y = THREE.MathUtils.lerp(rightHand.rotation.y, -0.25, lerpSpeed);
          rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, -0.35, lerpSpeed);
        }
      }
    }
  });
}
