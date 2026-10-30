(function (root) {
  'use strict';
  /* VOICE_FILES_START */
  const VOICE_FILES = {
  "homecoming_0": "assets/voice/homecoming_0.mp3",
  "homecoming_1": "assets/voice/homecoming_1.mp3",
  "homecoming_2": "assets/voice/homecoming_2.mp3",
  "homecoming_3": "assets/voice/homecoming_3.mp3",
  "letter_0": "assets/voice/letter_0.mp3",
  "letter_1": "assets/voice/letter_1.mp3",
  "letter_2": "assets/voice/letter_2.mp3",
  "letter_3": "assets/voice/letter_3.mp3",
  "music_0": "assets/voice/music_0.mp3",
  "music_1": "assets/voice/music_1.mp3",
  "music_2": "assets/voice/music_2.mp3",
  "music_3": "assets/voice/music_3.mp3",
  "reunion_0": "assets/voice/reunion_0.mp3",
  "reunion_1": "assets/voice/reunion_1.mp3",
  "reunion_2": "assets/voice/reunion_2.mp3",
  "reunion_3": "assets/voice/reunion_3.mp3",
  "river_0": "assets/voice/river_0.mp3",
  "river_1": "assets/voice/river_1.mp3",
  "river_2": "assets/voice/river_2.mp3",
  "river_3": "assets/voice/river_3.mp3",
  "stars_0": "assets/voice/stars_0.mp3",
  "stars_1": "assets/voice/stars_1.mp3",
  "stars_2": "assets/voice/stars_2.mp3",
  "stars_3": "assets/voice/stars_3.mp3",
  "father_0": "assets/voice/father_0.mp3",
  "father_1": "assets/voice/father_1.mp3",
  "father_2": "assets/voice/father_2.mp3",
  "father_3": "assets/voice/father_3.mp3",
  "father_4": "assets/voice/father_4.mp3",
  "guardian_0": "assets/voice/guardian_0.mp3",
  "guardian_1": "assets/voice/guardian_1.mp3",
  "guardian_2": "assets/voice/guardian_2.mp3",
  "ending_0": "assets/voice/ending_0.mp3",
  "ending_1": "assets/voice/ending_1.mp3",
  "ending_2": "assets/voice/ending_2.mp3",
  "ending_3": "assets/voice/ending_3.mp3",
  "ending_4": "assets/voice/ending_4.mp3",
  "ending_5": "assets/voice/ending_5.mp3"
};
  /* VOICE_FILES_END */

  class StoryVoice {
    constructor() {
      this.muted = false;
      this.available = typeof root.Audio === 'function' || !!root.speechSynthesis;
      this.source = typeof root.Audio === 'function' ? 'local' : (root.speechSynthesis ? 'speechSynthesis' : 'unavailable');
      this._token = 0;
      this._run = null;
    }

    _active(run) { return this._run === run && run.token === this._token && !run.done; }
    _status(run, status) {
      if (!this._active(run)) return;
      if (typeof run.onStatus === 'function') {
        try { run.onStatus(status); } catch (_) { /* A UI callback must not break audio cleanup. */ }
      }
    }

    _clearTimer(run) {
      if (run.timer) clearTimeout(run.timer);
      run.timer = null;
    }

    _watch(run, seconds, action) {
      if (!this._active(run)) return;
      this._clearTimer(run);
      run.timer = setTimeout(() => {
        if (!this._active(run)) return;
        if (run.paused) { this._watch(run, 1, action); return; }
        action();
      }, Math.max(0.1, seconds) * 1000);
    }

    _detachAudio(run) {
      const audio = run.audio;
      if (!audio) return;
      audio.onended = audio.onerror = audio.onplaying = audio.onloadedmetadata = null;
      try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch (_) { /* Already detached. */ }
      run.audio = null;
    }

    _cleanup(run) {
      this._clearTimer(run);
      this._detachAudio(run);
      if (run.utterance) {
        run.utterance.onend = run.utterance.onerror = run.utterance.onstart = null;
        try { root.speechSynthesis.cancel(); } catch (_) { /* Speech API can disappear with page teardown. */ }
        run.utterance = null;
      }
      if (run.voiceListener && root.speechSynthesis && root.speechSynthesis.removeEventListener) {
        root.speechSynthesis.removeEventListener('voiceschanged', run.voiceListener);
      }
      run.voiceListener = null;
    }

    _finish(run, completed) {
      if (!this._active(run)) return;
      run.done = true;
      this._cleanup(run);
      if (this._run === run) this._run = null;
      run.resolve(completed);
      if (completed && typeof run.onEnd === 'function') {
        try { run.onEnd(); } catch (_) { /* Audio state is already settled. */ }
      }
    }

    speak(line, { onEnd, onStatus } = {}) {
      this.stop();
      return new Promise(resolve => {
        const run = { token: this._token, line: line || {}, onEnd, onStatus, resolve, done: false, paused: false, audio: null, utterance: null, timer: null, voiceListener: null, fallbackStarted: false };
        this._run = run;
        if (this.muted) { this._status(run, '静音'); this._finish(run, false); return; }
        if (!line || !line.text) { this._status(run, '不可用'); this._finish(run, false); return; }
        this._status(run, '可用');
        if (!this._active(run)) return;
        const path = VOICE_FILES[line.id] || line.voice;
        if (typeof root.Audio !== 'function' || !path) { this._fallback(run); return; }
        try {
          const audio = new root.Audio(path);
          run.audio = audio;
          audio.preload = 'auto';
          audio.volume = 0.90;
          audio.onended = () => this._finish(run, true);
          audio.onerror = () => this._fallback(run);
          audio.onplaying = () => {
            if (!this._active(run)) return;
            this.available = true;
            this.source = 'local';
            this._status(run, '播放中');
            this._watch(run, this._remaining(run), () => this._fallback(run));
          };
          this._watch(run, 8, () => this._fallback(run));
          const playing = audio.play();
          if (playing && typeof playing.catch === 'function') playing.catch(() => this._fallback(run));
        } catch (_) { this._fallback(run); }
      });
    }

    _remaining(run) {
      const a = run.audio;
      if (a && Number.isFinite(a.duration) && a.duration > 0) return Math.min(120, a.duration - a.currentTime + 5);
      return Math.min(90, 12 + (run.line.text || '').length * 0.5);
    }

    _fallback(run) {
      if (!this._active(run) || run.fallbackStarted) return;
      run.fallbackStarted = true;
      this._clearTimer(run);
      this._detachAudio(run);
      const synth = root.speechSynthesis;
      if (!synth || typeof root.SpeechSynthesisUtterance !== 'function') { this._unavailable(run); return; }
      this.source = 'speechSynthesis';
      this._status(run, '系统语音');
      const start = () => {
        if (!this._active(run) || run.utterance) return;
        this._clearTimer(run);
        if (run.voiceListener && synth.removeEventListener) synth.removeEventListener('voiceschanged', run.voiceListener);
        run.voiceListener = null;
        const utterance = new root.SpeechSynthesisUtterance(run.line.text);
        const voices = synth.getVoices ? synth.getVoices() : [];
        const chinese = voices.filter(v => /^zh([_-]|$)/i.test(v.lang));
        const male = run.line.speaker === 'hero' || run.line.speaker === 'father';
        const preferred = male ? /yunxi|yunyang|kangkang|male|康康/i : /xiaoxiao|xiaoyi|huihui|yaoyao|晓晓|慧慧|瑶瑶/i;
        const local = chinese.filter(v => v.localService);
        const pool = local.length ? local : chinese;
        utterance.voice = pool.find(v => preferred.test(v.name)) || pool[0] || null;
        utterance.lang = 'zh-CN';
        utterance.rate = run.line.speaker === 'father' ? 0.86 : 0.92;
        utterance.pitch = run.line.speaker === 'father' ? 0.87 : (male ? 0.95 : 1.02);
        utterance.volume = 0.9;
        run.utterance = utterance;
        utterance.onstart = () => { if (this._active(run)) { this.available = true; this._status(run, '系统语音'); } };
        utterance.onend = () => this._finish(run, true);
        utterance.onerror = () => this._unavailable(run);
        this._watch(run, this._remaining(run), () => this._unavailable(run));
        try {
          synth.speak(utterance);
          if (run.paused && synth.pause) synth.pause();
        } catch (_) { this._unavailable(run); }
      };
      try {
        if (synth.getVoices && synth.getVoices().length) { start(); return; }
        run.voiceListener = start;
        if (synth.addEventListener) synth.addEventListener('voiceschanged', start);
        this._watch(run, 0.6, start);
      } catch (_) { this._unavailable(run); }
    }

    _unavailable(run) {
      if (!this._active(run)) return;
      this.available = false;
      this.source = 'unavailable';
      this._status(run, '不可用');
      this._finish(run, false);
    }

    stop() {
      const run = this._run;
      this._token++;
      this._run = null;
      if (!run) return;
      run.done = true;
      this._cleanup(run);
      run.resolve(false);
    }

    setMuted(value) {
      this.muted = !!value;
      if (this.muted && this._run) {
        this._status(this._run, '静音');
        this.stop();
      }
    }

    pause() {
      const run = this._run;
      if (!run || run.paused) return;
      run.paused = true;
      this._clearTimer(run);
      if (run.audio) run.audio.pause();
      if (run.utterance && root.speechSynthesis.pause) root.speechSynthesis.pause();
      this._status(run, '已暂停');
    }

    resume() {
      const run = this._run;
      if (!run || !run.paused || this.muted) return;
      run.paused = false;
      if (run.audio) {
        try {
          const playing = run.audio.play();
          if (playing && typeof playing.catch === 'function') playing.catch(() => this._fallback(run));
        } catch (_) { this._fallback(run); }
        this._watch(run, this._remaining(run), () => this._fallback(run));
      } else if (run.utterance) {
        try { root.speechSynthesis.resume(); } catch (_) { this._unavailable(run); return; }
        this._status(run, '系统语音');
        this._watch(run, this._remaining(run), () => this._unavailable(run));
      } else if (run.voiceListener) {
        run.voiceListener();
      }
    }
  }

  StoryVoice.files = VOICE_FILES;
  if (typeof module !== 'undefined' && module.exports) module.exports = StoryVoice;
  else root.StoryVoice = StoryVoice;
})(globalThis);
