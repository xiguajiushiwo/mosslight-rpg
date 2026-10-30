'use strict';
const assert = require('node:assert/strict');
const StoryVoice = require('../src/voice.js');
const audios = [];
let rejectNextPlay = false;
class FakeAudio {
  constructor(path) { this.src = path; this.duration = 3; this.currentTime = 0; this.paused = false; audios.push(this); }
  play() {
    if (rejectNextPlay) { rejectNextPlay = false; return Promise.reject(new Error('blocked/missing')); }
    this.paused = false;
    if (this.onplaying) this.onplaying();
    return Promise.resolve();
  }
  pause() { this.paused = true; }
  removeAttribute() { this.src = ''; }
  load() {}
}
global.Audio = FakeAudio;
const utterances = [];
global.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
global.speechSynthesis = {
  getVoices() { return [{name: 'Microsoft Kangkang', lang: 'zh-CN', localService: true}]; },
  speak(u) { utterances.push(u); if (u.onstart) u.onstart(); },
  cancel() {}, pause() {}, resume() {}
};
const line = id => ({id, speaker: 'hero', text: '这一次，我把答案说在现在。', voice: 'assets/voice/' + id + '.mp3'});
const flush = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  const v = new StoryVoice();
  let ends = 0;
  const a = v.speak(line('first'), {onEnd: () => ends++});
  const staleEnded = audios.at(-1).onended;
  const b = v.speak(line('second'), {onEnd: () => ends++});
  staleEnded();
  assert.equal(ends, 0, 'late previous-line completion cannot advance current dialogue');
  audios.at(-1).onended();
  assert.equal(await a, false);
  assert.equal(await b, true);
  assert.equal(ends, 1);

  rejectNextPlay = true;
  const fallback = v.speak(line('fallback'));
  await flush();
  assert.equal(v.source, 'speechSynthesis');
  assert.equal(utterances.at(-1).text, line('fallback').text);
  utterances.at(-1).onend();
  assert.equal(await fallback, true);

  rejectNextPlay = true;
  const old = v.speak(line('late-reject'));
  const fresh = v.speak(line('fresh'));
  const priorCount = utterances.length;
  await flush();
  assert.equal(utterances.length, priorCount, 'late old play rejection must not start fallback');
  assert.equal(v.source, 'local');
  audios.at(-1).onended();
  assert.equal(await old, false);
  assert.equal(await fresh, true);

  const statuses = [];
  const muted = v.speak(line('muted'), {onEnd: () => ends++, onStatus: s => statuses.push(s)});
  const beforeMute = ends;
  v.setMuted(true);
  assert.equal(await muted, false);
  assert.equal(ends, beforeMute);
  assert.equal(statuses.at(-1), '静音');
  assert.equal(await v.speak(line('already-muted')), false);
  v.setMuted(false);

  const paused = v.speak(line('paused'));
  const audio = audios.at(-1);
  v.pause();
  assert.equal(audio.paused, true);
  v.resume();
  assert.equal(audio.paused, false);
  audio.onended();
  assert.equal(await paused, true);

  global.Audio = undefined;
  global.speechSynthesis = undefined;
  const unavailable = new StoryVoice();
  let unavailableEnded = false;
  assert.equal(await unavailable.speak(line('unavailable'), {onEnd: () => { unavailableEnded = true; }}), false);
  assert.equal(unavailable.available, false);
  assert.equal(unavailable.source, 'unavailable');
  assert.equal(unavailableEnded, false, 'unavailable voice must not skip unread dialogue');
  console.log('PASS: stale callbacks, rejection fallback, late rejection, mute, pause/resume, unavailable voice');
})().catch(error => { console.error(error); process.exitCode = 1; });
