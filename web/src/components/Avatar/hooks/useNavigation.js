import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { avatarController } from '../controllers/AvatarController';

export const WAYPOINTS = {
  center: { pos: new THREE.Vector3(0, -0.9, 0.5), rot: Math.PI },
  bed: { pos: new THREE.Vector3(-1.6, -1.0, -0.8), rot: Math.PI / 2 },
  desk: { pos: new THREE.Vector3(1.9, -1.0, -1.1), rot: 0 },
  window: { pos: new THREE.Vector3(0, -0.9, -2.2), rot: 0 },
  sofa: { pos: new THREE.Vector3(-2.0, -1.0, 1.4), rot: Math.PI / 2 },
  bookshelf: { pos: new THREE.Vector3(2.8, -1.0, 1.0), rot: -Math.PI / 2 },
  door: { pos: new THREE.Vector3(0, -1.0, 2.3), rot: 0 },
  plant: { pos: new THREE.Vector3(-2.5, -1.0, -2.2), rot: Math.PI / 4 },
  charging: { pos: new THREE.Vector3(2.4, -1.0, 2.0), rot: -Math.PI / 4 }
};

export function useNavigation(vrm) {
  const currentPos = useRef(new THREE.Vector3(0, -0.9, 0.5));
  const currentRot = useRef(Math.PI);
  
  const targetWaypointName = useRef(null);
  const targetPos = useRef(null);
  const targetRotAfterArrival = useRef(Math.PI);
  
  const movementState = useRef('idle'); // 'idle' | 'turning' | 'walking' | 'arrived'

  useFrame((state, delta) => {
    if (!vrm) return;

    let destinationChanged = false;

    // 1. Sync waypoint targets
    if (avatarController.navTarget && avatarController.navTarget !== targetWaypointName.current) {
      targetWaypointName.current = avatarController.navTarget;
      const waypoint = WAYPOINTS[targetWaypointName.current];
      if (waypoint) {
        targetPos.current = waypoint.pos;
        targetRotAfterArrival.current = waypoint.rot;
        destinationChanged = true;
      }
    }

    // 2. Sync floor click coordinates
    if (avatarController.arrivedTargetPoint && (!targetPos.current || !targetPos.current.equals(avatarController.arrivedTargetPoint))) {
      targetWaypointName.current = null;
      targetPos.current = avatarController.arrivedTargetPoint;
      targetRotAfterArrival.current = Math.PI; // Face camera after walking to clicked spot
      destinationChanged = true;
    }

    if (destinationChanged) {
      movementState.current = 'turning';
      avatarController.isWalking = false; // Stop walking animation while turning in place
      avatarController.isSitting = false;
      avatarController.isLyingDown = false;
    }

    // If followMode is active, dynamically update destination to camera position
    if (avatarController.followMode) {
      const camera = state.camera;
      // Project destination directly in front of the camera (maintain natural distance ~1.5 units)
      const dirToCam = new THREE.Vector3().subVectors(camera.position, currentPos.current);
      const dist = dirToCam.length();
      
      // Stop walking if we are close enough, resume if camera moves away
      if (dist > 1.6) {
        dirToCam.y = 0; // Keep on floor
        dirToCam.normalize();
        
        targetPos.current = new THREE.Vector3()
          .copy(camera.position)
          .sub(dirToCam.multiplyScalar(1.4));
        targetPos.current.y = -0.9;
        
        targetRotAfterArrival.current = Math.atan2(camera.position.x - currentPos.current.x, camera.position.z - currentPos.current.z) + Math.PI;
        
        if (movementState.current === 'idle') {
          movementState.current = 'turning';
          avatarController.isWalking = false;
        }
      } else {
        if (movementState.current === 'walking' || movementState.current === 'turning') {
          movementState.current = 'arrived';
        }
      }
    }

    if (movementState.current === 'idle') {
      // Keep model positions locked to our current positions
      vrm.scene.position.copy(currentPos.current);
      vrm.scene.rotation.y = currentRot.current;
      return;
    }

    const targetCoordinate = targetPos.current;
    if (!targetCoordinate) {
      movementState.current = 'idle';
      avatarController.isWalking = false;
      return;
    }

    const lerpSpeed = delta * 6.0;
    const walkSpeed = 1.3; // natural speed in units per second

    if (movementState.current === 'turning') {
      const dx = targetCoordinate.x - currentPos.current.x;
      const dz = targetCoordinate.z - currentPos.current.z;
      
      if (Math.sqrt(dx * dx + dz * dz) < 0.1) {
        movementState.current = 'walking';
        avatarController.isWalking = true;
        return;
      }

      const targetAngle = Math.atan2(dx, dz) + Math.PI;
      
      // Calculate shortest angular distance to prevent rotation wrap bugs
      const diff = Math.atan2(Math.sin(targetAngle - currentRot.current), Math.cos(targetAngle - currentRot.current));
      
      currentRot.current += diff * lerpSpeed;
      vrm.scene.rotation.y = currentRot.current;

      if (Math.abs(diff) < 0.1) {
        movementState.current = 'walking';
        avatarController.isWalking = true; // Play walk animation during linear translation
      }
    } 
    
    else if (movementState.current === 'walking') {
      const dir = new THREE.Vector3().subVectors(targetCoordinate, currentPos.current);
      const dist = dir.length();
      
      // Slow down near destination (deceleration)
      const currentSpeed = dist < 0.4 ? walkSpeed * (dist / 0.4) : walkSpeed;

      if (dist < 0.05) {
        movementState.current = 'arrived';
        avatarController.isWalking = false; // Stop walking animation immediately on arrival
      } else {
        dir.normalize();
        currentPos.current.add(dir.multiplyScalar(currentSpeed * delta));
        vrm.scene.position.copy(currentPos.current);

        // Keep character rotated towards target during walk using shortest angle path
        const targetAngle = Math.atan2(targetCoordinate.x - currentPos.current.x, targetCoordinate.z - currentPos.current.z) + Math.PI;
        const diff = Math.atan2(Math.sin(targetAngle - currentRot.current), Math.cos(targetAngle - currentRot.current));
        currentRot.current += diff * lerpSpeed;
        vrm.scene.rotation.y = currentRot.current;
      }
    } 
    
    else if (movementState.current === 'arrived') {
      // Rotate to final waypoint default orientation using shortest angular path
      const diff = Math.atan2(Math.sin(targetRotAfterArrival.current - currentRot.current), Math.cos(targetRotAfterArrival.current - currentRot.current));
      
      currentRot.current += diff * lerpSpeed;
      vrm.scene.rotation.y = currentRot.current;

      if (Math.abs(diff) < 0.05) {
        movementState.current = 'idle';
        avatarController.isWalking = false;
        avatarController.navTarget = null;
        avatarController.arrivedTargetPoint = null;
        targetPos.current = null;
        targetWaypointName.current = null;

        // Apply sit or sleep state after arrival
        const destination = avatarController.destinationState;
        if (destination === 'sitting') {
          avatarController.isSitting = true;
        } else if (destination === 'lying') {
          avatarController.isLyingDown = true;
        }
        avatarController.destinationState = null;

        // Notify controller to execute next task in queue
        avatarController.onNavigationArrived();
      }
    }

    // Keep global controller coordinates in sync
    avatarController.worldPosition.copy(currentPos.current);
    avatarController.worldRotation = currentRot.current;
  });
}
