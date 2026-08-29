/**
 * Torneatron 2000 - Round Timer & Audio Chimes
 * Uses Web Audio API for zero-dependency sound notifications on mobiles.
 */

export class TournamentTimer {
  constructor(onTick, onComplete) {
    this.durationSeconds = 15 * 60; // 15 mins default
    this.remainingSeconds = this.durationSeconds;
    this.isRunning = false;
    this.intervalId = null;
    this.onTick = onTick;
    this.onComplete = onComplete;
  }

  setDuration(minutes) {
    this.pause();
    this.durationSeconds = Math.max(1, minutes * 60);
    this.remainingSeconds = this.durationSeconds;
    if (this.onTick) this.onTick(this.getFormattedTime());
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        if (this.onTick) this.onTick(this.getFormattedTime());

        if (this.remainingSeconds === 0) {
          this.pause();
          this.playChime();
          if (this.onComplete) this.onComplete();
        }
      }
    }, 1000);
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.durationSeconds;
    if (this.onTick) this.onTick(this.getFormattedTime());
  }

  addMinutes(mins) {
    this.remainingSeconds += mins * 60;
    if (this.remainingSeconds < 0) this.remainingSeconds = 0;
    if (this.onTick) this.onTick(this.getFormattedTime());
  }

  getFormattedTime() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Play 3 melodic beeps
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(523.25, 0, 0.2);   // C5
      playTone(659.25, 0.25, 0.2); // E5
      playTone(783.99, 0.5, 0.4);  // G5
    } catch (e) {
      console.warn('Audio tone play error:', e);
    }
  }
}
