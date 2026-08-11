export interface CommandTask {
  action: string;
  target?: string;
  angle?: number;
  duration?: number;
}

export function parseNaturalLanguageCommands(text: string): CommandTask[] {
  const normalized = text.toLowerCase().trim();
  
  // Split by connectors for multi-step commands
  const parts = normalized.split(/\b(?:then|and then|next|after that|afterward|,)\b/);
  const tasks: CommandTask[] = [];

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    // Interrupt / Stop
    if (/\b(?:stop|halt|freeze|stay)\b/.test(part)) {
      tasks.push({ action: 'stop' });
      continue;
    }

    // Follow Mode
    if (/\b(?:follow me|follow the camera|follow)\b/.test(part)) {
      tasks.push({ action: 'follow', target: 'true' });
      continue;
    }
    if (/\b(?:stop following|unfollow|stop follow)\b/.test(part)) {
      tasks.push({ action: 'follow', target: 'false' });
      continue;
    }

    // Sleep & Wake up
    if (/\b(?:go to sleep|sleep|go to bed|lie down|rest on bed)\b/.test(part)) {
      tasks.push({ action: 'sleep' });
      continue;
    }
    if (/\b(?:wake up|wake|get up from bed)\b/.test(part)) {
      tasks.push({ action: 'wakeUp' });
      continue;
    }

    // Sit / Stand
    if (/\b(?:sit on the chair|sit on chair|sit in the chair|sit in chair)\b/.test(part)) {
      tasks.push({ action: 'sit', target: 'chair' });
      continue;
    }
    if (/\b(?:sit on the bed|sit on bed)\b/.test(part)) {
      tasks.push({ action: 'sit', target: 'bed' });
      continue;
    }
    if (/\b(?:sit on the sofa|sit on sofa|sit on the couch|sit on couch)\b/.test(part)) {
      tasks.push({ action: 'sit', target: 'sofa' });
      continue;
    }
    if (/\b(?:sit down|sit)\b/.test(part)) {
      tasks.push({ action: 'sit', target: 'chair' }); // Default to desk chair
      continue;
    }
    if (/\b(?:stand up|stand)\b/.test(part)) {
      tasks.push({ action: 'stand' });
      continue;
    }

    // Curtains and Window
    if (/\b(?:open the window|open window)\b/.test(part)) {
      tasks.push({ action: 'openWindow' });
      continue;
    }
    if (/\b(?:close the curtains|close curtains|close curtain|shut curtains)\b/.test(part)) {
      tasks.push({ action: 'closeCurtains' });
      continue;
    }
    if (/\b(?:look outside|look out window|look out the window|peer outside)\b/.test(part)) {
      tasks.push({ action: 'lookOutside' });
      continue;
    }

    // Object interactions
    if (/\b(?:read a book|read book|read books|inspect bookshelf)\b/.test(part)) {
      tasks.push({ action: 'readBook' });
      continue;
    }
    if (/\b(?:pick up the coffee mug|pick up coffee mug|pick up mug|take mug)\b/.test(part)) {
      tasks.push({ action: 'pickUpMug' });
      continue;
    }
    if (/\b(?:put it back|put mug back|place mug down)\b/.test(part)) {
      tasks.push({ action: 'putMugBack' });
      continue;
    }
    if (/\b(?:look at the monitor|look at monitor|look at screen|inspect screen)\b/.test(part)) {
      tasks.push({ action: 'lookAtMonitor' });
      continue;
    }

    // Basic movements to locations
    if (/\b(?:go to the bed|go to bed|walk to bed|walk to the bed)\b/.test(part)) {
      tasks.push({ action: 'walk', target: 'bed' });
      continue;
    }
    if (/\b(?:go to the desk|go to desk|walk to desk|walk to the desk|go to your desk)\b/.test(part)) {
      tasks.push({ action: 'walk', target: 'desk' });
      continue;
    }
    if (/\b(?:go to the window|go to window|walk to window|walk to the window)\b/.test(part)) {
      tasks.push({ action: 'walk', target: 'window' });
      continue;
    }
    if (/\b(?:go to the sofa|go to sofa|walk to sofa|walk to the sofa|go to the couch|go to couch)\b/.test(part)) {
      tasks.push({ action: 'walk', target: 'sofa' });
      continue;
    }
    if (/\b(?:go to the bookshelf|go to bookshelf|walk to bookshelf|walk to the bookshelf)\b/.test(part)) {
      tasks.push({ action: 'walk', target: 'bookshelf' });
      continue;
    }
    if (/\b(?:go to the door|go to door|walk to door|walk to the door)\b/.test(part)) {
      tasks.push({ action: 'walk', target: 'door' });
      continue;
    }
    if (/\b(?:go to the plant|go to plant|walk to plant|walk to the plant)\b/.test(part)) {
      tasks.push({ action: 'walk', target: 'plant' });
      continue;
    }
    if (/\b(?:go to the charging station|go to charging station|go to charging|walk to charging)\b/.test(part)) {
      tasks.push({ action: 'walk', target: 'charging' });
      continue;
    }
    if (/\b(?:come here|come to me|come back|stand there|return to the center|go back|return home|go home)\b/.test(part)) {
      tasks.push({ action: 'walk', target: 'center' });
      continue;
    }

    // Actions & Animations
    if (/\b(?:wave|say hello|greet)\b/.test(part)) {
      tasks.push({ action: 'wave' });
      continue;
    }
    if (/\b(?:dance|groove|bust a move)\b/.test(part)) {
      tasks.push({ action: 'dance' });
      continue;
    }
    if (/\b(?:walk around|wander|stroll)\b/.test(part)) {
      tasks.push({ action: 'walkAround' });
      continue;
    }
    if (/\b(?:stretch|warm up)\b/.test(part)) {
      tasks.push({ action: 'stretch' });
      continue;
    }
    if (/\b(?:jump|hop)\b/.test(part)) {
      tasks.push({ action: 'jump' });
      continue;
    }
    if (/\b(?:spin|twirl|rotate)\b/.test(part)) {
      tasks.push({ action: 'spin' });
      continue;
    }
    if (/\b(?:turn left)\b/.test(part)) {
      tasks.push({ action: 'turn', target: 'left' });
      continue;
    }
    if (/\b(?:turn right)\b/.test(part)) {
      tasks.push({ action: 'turn', target: 'right' });
      continue;
    }
    if (/\b(?:face me|look at me|turn to me)\b/.test(part)) {
      tasks.push({ action: 'faceMe' });
      continue;
    }
    if (/\b(?:relax|chill|take a break)\b/.test(part)) {
      tasks.push({ action: 'relax' });
      continue;
    }
    if (/\b(?:idle|stand idle)\b/.test(part)) {
      tasks.push({ action: 'idle' });
      continue;
    }
  }

  return tasks;
}
