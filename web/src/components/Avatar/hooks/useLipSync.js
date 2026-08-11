import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AVATAR_CONFIG } from '../config/avatarConfig';
import { avatarController } from '../controllers/AvatarController';
import { VISEME_MAP } from '../blendshapes/visemeMap';

export function useLipSync(vrm) {
  // Web Audio API refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  
  // Smoothing values
  const currentVisemesRef = useRef({
    aa: 0,
    ih: 0,
    ou: 0,
    ee: 0,
    oh: 0
  });

  // Setup Web Audio API on component mount
  useEffect(() => {
    // Audio Context is initialized on first user interaction to comply with browser autoplay policies
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Expose methods globally via window or a custom controller bind
  useEffect(() => {
    // Expose a method to start lip sync using an AudioNode (e.g. from an Audio element or MediaStream)
    avatarController.startAudioLipSync = (audioSource) => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        // Setup Analyser
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 512;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        // Connect source to analyser
        if (audioSource instanceof HTMLAudioElement) {
          // If it's a media element, create a media element source
          const source = ctx.createMediaElementSource(audioSource);
          source.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
        } else if (audioSource instanceof MediaStream) {
          // If it's a microphone stream
          const source = ctx.createMediaStreamSource(audioSource);
          source.connect(analyserRef.current);
          // Don't connect mic to destination to avoid feedback loops!
        }
        
        avatarController.talking = true;
      } catch (err) {
        console.error('Failed to initialize Audio Lip Sync:', err);
      }
    };

    avatarController.stopAudioLipSync = () => {
      analyserRef.current = null;
      avatarController.talking = false;
    };
  }, []);

  useFrame((state, delta) => {
    if (!vrm || !vrm.expressionManager) return;

    const manager = vrm.expressionManager;
    const config = AVATAR_CONFIG.lipSync;
    const lerpFactor = THREE.MathUtils.clamp(delta / config.visemeSmoothing, 0, 1);

    // Target values of expressions
    let targets = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };

    if (avatarController.talking) {
      if (analyserRef.current && dataArrayRef.current) {
        // --- REAL-TIME AUDIO FREQUENCY LISP SYNC ---
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;
        
        // Retrieve time domain & frequency domain data
        analyser.getByteFrequencyData(dataArray);

        // 1. Calculate overall amplitude (Root Mean Square)
        let totalAmp = 0;
        for (let i = 0; i < dataArray.length; i++) {
          totalAmp += dataArray[i];
        }
        const averageAmp = totalAmp / dataArray.length / 255.0; // scale 0.0 - 1.0

        if (averageAmp > config.amplitudeThreshold) {
          const mouthOpenVal = Math.min(averageAmp * config.amplitudeScale, 1.0);

          // 2. Perform Formant analysis by splitting frequency spectrum
          // Divide dataArray bins into vowel frequency range groups:
          // Low bands (bass vowels: O / U)
          // Mid bands (standard speech: A)
          // High-mid bands (bright vowels: E / I)
          let lowSum = 0;
          let midSum = 0;
          let highSum = 0;

          const partitionSize = Math.floor(dataArray.length / 3);
          for (let i = 0; i < dataArray.length; i++) {
            if (i < partitionSize) lowSum += dataArray[i];
            else if (i < partitionSize * 2) midSum += dataArray[i];
            else highSum += dataArray[i];
          }

          const lowAvg = lowSum / partitionSize / 255.0;
          const midAvg = midSum / partitionSize / 255.0;
          const highAvg = highSum / partitionSize / 255.0;

          const totalFreqSum = lowAvg + midAvg + highAvg || 1;

          // Distribute mouth open amount based on frequency dominance
          targets.aa = mouthOpenVal * (midAvg / totalFreqSum);
          targets.ee = mouthOpenVal * (highAvg / totalFreqSum) * 0.7;
          targets.ih = mouthOpenVal * (highAvg / totalFreqSum) * 0.3;
          targets.oh = mouthOpenVal * (lowAvg / totalFreqSum) * 0.6;
          targets.ou = mouthOpenVal * (lowAvg / totalFreqSum) * 0.4;
        }
      } else {
        // --- TEXT-DRIVEN/MANUAL VISEME QUEUE ---
        // If talking but no audio analyser (e.g. text/phoneme events),
        // read directly from avatarController.visemes state
        targets = { ...avatarController.visemes };
      }
    }

    // --- APPLY SMOOTHED LERP AND SET EXPRESSIONS ---
    Object.keys(targets).forEach((key) => {
      const targetVal = targets[key];
      const currentVal = currentVisemesRef.current[key];
      const nextVal = THREE.MathUtils.lerp(currentVal, targetVal, lerpFactor);

      currentVisemesRef.current[key] = nextVal;
      manager.setValue(key, nextVal);
    });
  });
}
