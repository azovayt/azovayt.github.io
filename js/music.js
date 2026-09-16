// ================= SAKİN MÜZİK =================
let audioContext = null;
let musicPlaying = false;
let musicTimeout = null;
let currentOscillators = [];

const calmMelody = [
  { freq: 523.25, dur: 600 }, { freq: 0, dur: 200 },
  { freq: 659.25, dur: 600 }, { freq: 0, dur: 200 },
  { freq: 783.99, dur: 800 }, { freq: 0, dur: 400 },
  { freq: 659.25, dur: 600 }, { freq: 523.25, dur: 600 },
  { freq: 0, dur: 400 },
  { freq: 587.33, dur: 600 }, { freq: 0, dur: 200 },
  { freq: 783.99, dur: 600 }, { freq: 0, dur: 200 },
  { freq: 880.0, dur: 800 }, { freq: 0, dur: 400 },
  { freq: 783.99, dur: 600 }, { freq: 659.25, dur: 600 },
  { freq: 0, dur: 400 },
  { freq: 523.25, dur: 1000 }, { freq: 0, dur: 600 },
];

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playNote(freq, startTime, duration) {
  if (freq === 0) return;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = freq;
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.04, startTime + 0.1);
  gainNode.gain.linearRampToValueAtTime(0.035, startTime + duration / 1000 - 0.1);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration / 1000);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration / 1000);
  currentOscillators.push(oscillator);
}

function playMelody() {
  if (!musicPlaying) return;
  let currentTime = audioContext.currentTime;
  const totalDuration = calmMelody.reduce((sum, note) => sum + note.dur, 0);
  calmMelody.forEach((note) => {
    playNote(note.freq, currentTime, note.dur);
    currentTime += note.dur / 1000;
  });
  musicTimeout = setTimeout(() => {
    if (musicPlaying) playMelody();
  }, totalDuration);
}

function toggleMusic() {
  const btn = document.getElementById("musicToggle");
  if (!musicPlaying) {
    initAudio();
    musicPlaying = true;
    btn.classList.add("playing");
    btn.innerHTML = "🔊 <span>Müziği Kapat</span>";
    playMelody();
  } else {
    musicPlaying = false;
    btn.classList.remove("playing");
    btn.innerHTML = "🔇 <span>Müziği Aç</span>";
    if (musicTimeout) clearTimeout(musicTimeout);
    currentOscillators.forEach((osc) => {
      try { osc.stop(); } catch (e) {}
    });
    currentOscillators = [];
  }
}
