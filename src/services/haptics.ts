/**
 * Grit & Static: Personal Trainer - Haptics, Audio Synth & Screen WakeLock Service
 */
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

class HapticService {
  private audioCtx: AudioContext | null = null;
  private wakeLockObj: any = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Unlocks vibration/audio context on user gesture (click/tap).
   * Call this on button presses (e.g. Start Workout) to satisfy Chrome gesture policy.
   */
  public unlockVibration(): void {
    try {
      this.getAudioContext();
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(1);
      }
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch {
      // ignore
    }
  }

  /**
   * Safe vibration wrapper using Capacitor Native Haptics with Web Fallback
   */
  public vibrate(pattern: number | number[]): boolean {
    const duration = Array.isArray(pattern) ? (pattern[0] || 100) : pattern;

    // 1. Try Native Capacitor Haptics (For APK)
    try {
      Haptics.vibrate({ duration: Math.max(duration, 30) }).catch(() => {
        // Fallback to Web API if native call fails
        if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
          navigator.vibrate(pattern);
        }
      });
    } catch {
      // Fallback
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        try {
          navigator.vibrate(pattern);
        } catch {
          // ignore
        }
      }
    }

    // 2. Also trigger navigator.vibrate for Web/PWA
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  // --- Synthesized Audio Tone Fallback ---
  public playTone(freq: number, durationMs: number, type: OscillatorType = 'sine', volume: number = 0.2): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // ignore audio context failures
    }
  }

  // --- Specialized Workout Vibration & Audio Signals ---

  /** Metronome Tick for Japanese Walking (130 BPM or 95 BPM) */
  public triggerMetronomeTick(isFast: boolean, soundEnabled: boolean = true): void {
    const vibDuration = isFast ? 20 : 15;
    this.vibrate(vibDuration);

    if (soundEnabled) {
      const freq = isFast ? 880 : 660; // High click for fast, medium for normal
      this.playTone(freq, 25, 'triangle', 0.15);
    }
  }

  /** Countdown Tick (3, 2, 1) */
  public triggerCountdownTick(soundEnabled: boolean = true): void {
    this.vibrate([40]);
    if (soundEnabled) {
      this.playTone(440, 80, 'sine', 0.2);
    }
  }

  /** Final Countdown Tick (GO!) */
  public triggerGoSignal(soundEnabled: boolean = true): void {
    this.vibrate([100, 50, 200]);
    if (soundEnabled) {
      this.playTone(880, 250, 'sine', 0.35);
    }
  }

  /** Exercise / Set Completion Signal */
  public triggerSetComplete(soundEnabled: boolean = true): void {
    this.vibrate([100, 60, 100, 60, 250]);
    if (soundEnabled) {
      this.playTone(523.25, 120, 'sine', 0.25); // C5
      setTimeout(() => this.playTone(659.25, 180, 'sine', 0.25), 130); // E5
    }
  }

  /** Japanese Walking Phase Change Alert (e.g. Fast -> Slow or Slow -> Fast) */
  public triggerPhaseChangeAlert(toFastMode: boolean, soundEnabled: boolean = true): void {
    if (toFastMode) {
      // 3 fast urgent pulses
      this.vibrate([150, 80, 150, 80, 300]);
      if (soundEnabled) {
        this.playTone(587.33, 100, 'square', 0.25);
        setTimeout(() => this.playTone(880, 200, 'square', 0.3), 120);
      }
    } else {
      // 2 smooth pulses
      this.vibrate([250, 100, 250]);
      if (soundEnabled) {
        this.playTone(880, 100, 'sine', 0.25);
        setTimeout(() => this.playTone(587.33, 200, 'sine', 0.25), 120);
      }
    }
  }

  /** Workout Finish Celebration */
  public triggerWorkoutFinished(soundEnabled: boolean = true): void {
    this.vibrate([150, 80, 150, 80, 150, 80, 400]);
    if (soundEnabled) {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 180, 'triangle', 0.3), idx * 120);
      });
    }
  }

  // --- Screen WakeLock (Always On Display) ---
  public async requestWakeLock(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        this.wakeLockObj = await (navigator as any).wakeLock.request('screen');
        return true;
      } catch (err) {
        return false;
      }
    }
    return false;
  }

  public releaseWakeLock(): void {
    if (this.wakeLockObj) {
      try {
        this.wakeLockObj.release();
      } catch (e) {
        // ignore
      }
      this.wakeLockObj = null;
    }
  }
}

export const haptics = new HapticService();
