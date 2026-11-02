// Browser Web Audio API synthesizer for the 24Hz Lithic Drone and Canyon Ambient

class LithicAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public togglePlayback(): boolean {
    this.init();
    if (!this.ctx) return false;

    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public start() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    this.stop();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. 24Hz Sub-bass Drone
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.setValueAtTime(24, this.ctx.currentTime);

    // Subtle 48Hz harmonic overtone
    const harmonicOsc = this.ctx.createOscillator();
    harmonicOsc.type = 'triangle';
    harmonicOsc.frequency.setValueAtTime(48, this.ctx.currentTime);

    const harmonicGain = this.ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    harmonicOsc.connect(harmonicGain);

    this.subGain = this.ctx.createGain();
    this.subGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    this.subOsc.connect(this.subGain);
    harmonicGain.connect(this.subGain);
    this.subGain.connect(this.masterGain);

    this.subOsc.start();
    harmonicOsc.start();

    // 2. Canyon Wind (Low-passed noise buffer)
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    this.noiseNode.connect(filter);
    filter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);

    this.noiseNode.start();
    this.isPlaying = true;
  }

  public stop() {
    if (this.subOsc) {
      try { this.subOsc.stop(); } catch {}
      this.subOsc.disconnect();
      this.subOsc = null;
    }
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch {}
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    this.isPlaying = false;
  }

  public playClapper() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  public getStatus() {
    return this.isPlaying;
  }
}

export const lithicAudio = new LithicAudioEngine();
