// ================= SES VE MÜZİK YÖNETİMİ =================
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
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

// ⭐⭐⭐ YENİ: MİKRO SES EFEKTLERİ (SFX) ⭐⭐⭐
function playSFX(type) {
  initAudio(); // Ses motorunun hazır olduğundan emin ol
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  osc.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (type === 'pop') {
    // Kod bloğu ekleme/çıkarma sesi (Kısa, neşeli "pop")
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } 
  else if (type === 'ding') {
    // Coin toplama veya seviye bitirme sesi (Parlak "ding")
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5 notası
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } 
  else if (type === 'buzz') {
    // Engele veya duvara çarpma sesi (Düşük, uyarıcı "buzz")
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.2);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
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
