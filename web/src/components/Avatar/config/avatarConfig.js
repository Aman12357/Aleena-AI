export const AVATAR_CONFIG = {
  modelUrl: '/avatar.vrm',
  
  // Eye tracking & LookAt settings
  eyeTracking: {
    enabled: true,
    lerpSpeed: 5.0, // Speed of eye interpolation
    maxHeadRotation: 0.35, // Limit neck/head turn range in radians (approx 20 deg)
    maxEyeRotation: 0.25, // Limit eye turn range in radians (approx 15 deg)
    saccadeIntervalMin: 1.5, // Min time between micro-eye movements
    saccadeIntervalMax: 4.0, // Max time between micro-eye movements
    saccadeMagnitude: 0.08, // Size of random micro-movements
  },

  // Idle animation parameters
  idle: {
    breathingSpeed: 1.8, // Speed of breathing cycle in rad/sec
    breathingAmplitude: 0.015, // Breath translation/rotation amount
    blinkIntervalMin: 2.0, // Min time between blinks in seconds
    blinkIntervalMax: 6.0, // Max time between blinks in seconds
    blinkDuration: 0.15, // Blinking speed in seconds
  },

  // Lip Sync config
  lipSync: {
    amplitudeThreshold: 0.02, // Noise gate for audio
    amplitudeScale: 2.5, // Multiplier for mouth opening
    visemeSmoothing: 0.25, // Lerp speed for mouth shapes
  },

  // Emotion settings
  emotions: {
    transitionSpeed: 3.5, // Lerp speed when blending emotions
  }
};
