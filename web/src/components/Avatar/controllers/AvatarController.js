import * as THREE from 'three';

class AvatarController {
  constructor() {
    this.vrm = null;
    this.mixer = null;
    this.animations = {};
    this.currentAction = null;
    
    // Internal States
    this.talking = false;
    this.listening = false;
    this.lookTarget = new THREE.Vector3(0, 1.4, 3); // Default look forward
    this.emotion = 'neutral';
    this.visemes = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
    this.modelUrl = '/avatar_original.vrm'; // Default model on startup
    this.inactivityTime = 0;
    
    this.navTarget = null;
    this.destinationState = null;
    this.worldPosition = new THREE.Vector3(0, -0.9, 0.5);
    this.worldRotation = Math.PI;
    this.isWalking = false;
    this.isSitting = false;
    this.isLyingDown = false;
    
    // Task Queue & Command System
    this.taskQueue = [];
    this.currentTask = null;
    this.followMode = false;
    this.lastCommand = "";
    this.interactObject = null; // 'mug' | 'book' | 'lamp' | 'keyboard' | 'mouse' | 'window' | 'curtains' | 'plant' | 'monitor'
    this.arrivedTargetPoint = null; // For arbitrary floor clicks

    // Callback registers
    this.listeners = new Set();
    this.onSpeechRequest = null;
  }

  // Bind the controller to the loaded VRM model instance
  register(vrm, mixer, animations = {}) {
    this.vrm = vrm;
    this.mixer = mixer;
    this.animations = animations;
    this.notifyListeners();
  }

  // Unregister VRM
  unregister() {
    this.vrm = null;
    this.mixer = null;
    this.animations = {};
    this.notifyListeners();
  }

  // Subscribe to state changes (useful for UI components)
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this));
  }

  // --- Task Queue & Command Execution ---
  executeCommandSequence(tasks) {
    this.stopMoving(); // Clear old tasks first
    this.taskQueue = tasks;
    this.runNextTask();
  }

  runNextTask() {
    if (this.taskQueue.length === 0) {
      this.currentTask = null;
      this.notifyListeners();
      return;
    }

    this.currentTask = this.taskQueue.shift();
    this.notifyListeners();
    console.log("Running task:", this.currentTask);

    const { action, target } = this.currentTask;

    switch (action) {
      case 'walk':
        if (target) {
          this.moveTo(target);
        } else {
          this.completeCurrentTask();
        }
        break;
      case 'sit':
        this.sit(target || 'chair');
        break;
      case 'sleep':
        this.sleep();
        break;
      case 'wakeUp':
        this.wakeUp();
        break;
      case 'stand':
        this.standUp();
        break;
      case 'wave':
        this.wave();
        break;
      case 'dance':
        this.dance();
        break;
      case 'lookOutside':
        this.lookOutside();
        break;
      case 'readBook':
        this.interact('book');
        break;
      case 'pickUpMug':
        this.interact('mug');
        break;
      case 'putMugBack':
        this.interact(null);
        break;
      case 'lookAtMonitor':
        this.interact('monitor');
        break;
      case 'openWindow':
        this.interact('window');
        break;
      case 'closeCurtains':
        this.interact('curtains');
        break;
      case 'follow':
        if (target === 'true') {
          this.startFollowMode();
        } else {
          this.stopFollowMode();
        }
        this.completeCurrentTask();
        break;
      case 'stop':
        this.stopMoving();
        break;
      case 'relax':
        this.setEmotion('happy');
        this.playAnimation('relax');
        setTimeout(() => this.completeCurrentTask(), 3000);
        break;
      case 'idle':
        this.setEmotion('neutral');
        this.completeCurrentTask();
        break;
      case 'turn':
        this.turn(target === 'left' ? Math.PI / 2 : -Math.PI / 2);
        break;
      case 'faceMe':
        this.faceMe();
        break;
      case 'walkAround':
        this.walkAround();
        break;
      case 'stretch':
        this.playAnimation('stretch');
        setTimeout(() => this.completeCurrentTask(), 2500);
        break;
      case 'jump':
        this.playAnimation('jump');
        setTimeout(() => this.completeCurrentTask(), 1200);
        break;
      case 'spin':
        this.playAnimation('spin');
        setTimeout(() => this.completeCurrentTask(), 1500);
        break;
      default:
        this.completeCurrentTask();
        break;
    }
  }

  completeCurrentTask() {
    console.log("Completed task:", this.currentTask);
    this.runNextTask();
  }

  // --- Public APIs ---

  moveTo(waypoint, stateAfterArrival = null) {
    this.followMode = false;
    this.arrivedTargetPoint = null;
    this.navTarget = waypoint;
    this.destinationState = stateAfterArrival;
    this.inactivityTime = 0;
    this.notifyListeners();
  }

  walkToPoint(point) {
    this.followMode = false;
    this.navTarget = null;
    this.destinationState = null;
    this.isSitting = false;
    this.isLyingDown = false;
    this.isWalking = true;
    this.inactivityTime = 0;
    this.arrivedTargetPoint = new THREE.Vector3(point.x, -0.9, point.z);
    this.notifyListeners();
  }

  stopMoving() {
    this.taskQueue = [];
    this.currentTask = null;
    this.followMode = false;
    this.isWalking = false;
    this.navTarget = null;
    this.arrivedTargetPoint = null;
    this.destinationState = null;
    this.notifyListeners();
  }

  followUser() {
    this.startFollowMode();
  }

  startFollowMode() {
    this.stopMoving();
    this.followMode = true;
    this.inactivityTime = 0;
    this.notifyListeners();
  }

  stopFollowMode() {
    this.followMode = false;
    this.notifyListeners();
  }

  playAnimation(name, options = {}) {
    if (this.vrm) {
      // Procedural animations can be handled inside useFrame
      this.currentAction = name;
      this.notifyListeners();
    }
  }

  sit(objectName) {
    this.isWalking = false;
    this.isLyingDown = false;
    
    let target = 'desk';
    if (objectName === 'bed') target = 'bed';
    if (objectName === 'sofa') target = 'sofa';

    this.moveTo(target, 'sitting');
    this.setEmotion('relaxed');
  }

  sleep() {
    this.isWalking = false;
    this.isSitting = false;
    this.moveTo('bed', 'lying');
    this.setEmotion('sleeping');
  }

  wakeUp() {
    this.isLyingDown = false;
    this.isSitting = false;
    this.setEmotion('happy');
    this.moveTo('center');
    this.wave();
  }

  standUp() {
    this.isSitting = false;
    this.isLyingDown = false;
    this.setEmotion('neutral');
    this.moveTo('center');
  }

  lookOutside() {
    this.moveTo('window', 'looking');
    this.setEmotion('curious');
  }

  interact(objectName) {
    this.interactObject = objectName;
    if (objectName === 'book') {
      this.moveTo('bookshelf');
      this.setEmotion('thinking');
    } else if (objectName === 'mug') {
      this.moveTo('center');
      this.setEmotion('happy');
    } else if (objectName === 'monitor') {
      this.moveTo('desk');
      this.setEmotion('thinking');
    } else if (objectName === 'window') {
      this.moveTo('window');
      this.setEmotion('curious');
    }
    this.notifyListeners();
  }

  lookAt(x, y, z) {
    if (x instanceof THREE.Vector3) {
      this.lookTarget.copy(x);
    } else {
      this.lookTarget.set(x, y, z);
    }
  }

  wave() {
    this.currentAction = 'wave';
    this.notifyListeners();
  }

  dance() {
    this.currentAction = 'dance';
    this.notifyListeners();
  }

  returnHome() {
    this.moveTo('center');
  }

  // --- Helpers triggered from hook systems ---
  onNavigationArrived() {
    if (this.currentTask && this.currentTask.action === 'walk') {
      this.completeCurrentTask();
    } else {
      this.notifyListeners();
    }
  }

  onGestureComplete() {
    if (this.currentTask && ['wave', 'dance', 'stretch', 'jump', 'spin'].includes(this.currentTask.action)) {
      this.completeCurrentTask();
    }
  }

  turn(angle) {
    this.worldRotation += angle;
    this.completeCurrentTask();
  }

  faceMe() {
    // Face camera (rotation Math.PI)
    this.worldRotation = Math.PI;
    this.completeCurrentTask();
  }

  walkAround() {
    const locations = ['center', 'bed', 'desk', 'window', 'sofa', 'bookshelf'];
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];
    this.moveTo(randomLoc);
  }

  setEmotion(emotionName) {
    this.emotion = emotionName;
    this.notifyListeners();
  }

  setViseme(visemeName, value) {
    if (this.visemes.hasOwnProperty(visemeName)) {
      this.visemes[visemeName] = value;
      this.notifyListeners();
    }
  }

  sendSpeech(text) {
    if (this.onSpeechRequest) {
      this.onSpeechRequest(text);
    }
  }
}

export const avatarController = new AvatarController();
