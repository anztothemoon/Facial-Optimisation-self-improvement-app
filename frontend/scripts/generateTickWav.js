/**
 * Writes a tiny mono WAV beep for workout timer ticks (no external download).
 */
const fs = require('fs');
const path = require('path');

const sampleRate = 11025;
const duration = 0.06;
const freq = 880;
const numSamples = Math.floor(sampleRate * duration);
const samples = new Int16Array(numSamples);
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const env = i / numSamples;
  samples[i] = Math.round(Math.sin(2 * Math.PI * freq * t) * 0.22 * 32767 * (1 - env * 0.3));
}

const dataSize = numSamples * 2;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < numSamples; i++) {
  buffer.writeInt16LE(samples[i], 44 + i * 2);
}

const out = path.join(__dirname, '..', 'assets', 'sounds', 'tick.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buffer);
console.log('Wrote', out, buffer.length, 'bytes');
