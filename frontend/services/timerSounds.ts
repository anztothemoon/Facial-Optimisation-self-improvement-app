import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// Generated locally (see scripts/generateTickWav.js) — bundled, works offline.
const TICK_ASSET = require('../assets/sounds/tick.wav') as number;

let tickSound: Audio.Sound | null = null;
let endSound: Audio.Sound | null = null;

export async function initTimerSounds(): Promise<{ tickOk: boolean; endOk: boolean }> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  } catch {
    /* ignore */
  }

  let tickOk = false;
  let endOk = false;

  if (!tickSound) {
    try {
      const { sound } = await Audio.Sound.createAsync(TICK_ASSET, {
        shouldPlay: false,
        volume: 0.28,
        isLooping: false,
      });
      tickSound = sound;
      tickOk = true;
    } catch {
      tickOk = false;
    }
  } else {
    tickOk = true;
  }

  if (!endSound) {
    try {
      const { sound } = await Audio.Sound.createAsync(TICK_ASSET, {
        shouldPlay: false,
        volume: 0.48,
        isLooping: false,
      });
      endSound = sound;
      endOk = true;
    } catch {
      endOk = false;
    }
  } else {
    endOk = true;
  }

  return { tickOk, endOk };
}

export async function unloadTimerSounds(): Promise<void> {
  if (tickSound) {
    await tickSound.unloadAsync();
    tickSound = null;
  }
  if (endSound) {
    await endSound.unloadAsync();
    endSound = null;
  }
}

export async function playSecondTick(soundEnabled: boolean): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  if (!soundEnabled || !tickSound) return;
  try {
    await tickSound.replayAsync();
  } catch {
    /* ignore */
  }
}

export async function playIntervalEnd(soundEnabled: boolean): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  if (!soundEnabled || !endSound) return;
  try {
    await endSound.replayAsync();
  } catch {
    /* ignore */
  }
}
