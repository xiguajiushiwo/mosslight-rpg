const {test}=require('node:test'),assert=require('node:assert/strict');
const {Game}=require('../src/core.js');const {SCENES,CAST}=require('../src/story.js');const fs=require('node:fs'),path=require('node:path');
const tick=(g,t,input={})=>{for(let i=0;i<t*60;i++)g.step(1/60,input);};
test('three attacks have observable windup, strike and recovery; roll cancels',()=>{
  const g=new Game();g.enemies.forEach(e=>e.alive=false);
  for(let combo=1;combo<=3;combo++){assert.equal(g.attack(),true);assert.equal(g.player.action.combo,combo);assert.equal(g.player.action.hit,false);tick(g,.28);assert.equal(g.player.action.hit,true);assert.equal(g.attack(),false);tick(g,.42);}
  tick(g,1.3);g.attack();assert.equal(g.player.combo,1);assert.equal(g.dash(1,0),true);assert.equal(g.player.action,null);assert.ok(g.player.invulnerable>0);assert.equal(g.attack(),false);
});
test('talent spending has a budget and persists derived health correctly',()=>{
  const g=new Game();assert.equal(g.learnTalent('heart'),false);g.addXP(56);assert.equal(g.learnTalent('heart'),true);assert.equal(g.player.maxHp,134);assert.equal(g.talentPoints,0);assert.equal(g.learnTalent('blade'),false);
  const loaded=Game.fromSave(g.serialize());assert.equal(loaded.talents.heart,1);assert.equal(loaded.player.maxHp,134);assert.equal(loaded.talentPoints,0);
});
test('memory sequence rejects out of order actions and duplicate rewards',()=>{
  const g=new Game();g.acceptQuest();assert.equal(g.startEscort(),false);g.mirrors=[1,0,3];assert.equal(g.alignStars(),false);
  g.musicNote(1);assert.deepEqual(g.musicNotes,[]);g.musicNote(0);g.musicNote(2);g.musicNote(1);const xp=g.player.xp;g.musicNote(1);assert.equal(g.player.xp,xp);assert.equal(g.completeMemory('stars'),false);
});
test('escort waits when player runs ahead and can restart after failure',()=>{
  const g=new Game();g.acceptQuest();g.completeMemory('music');g.player.x=1550;g.player.y=1160;g.startEscort();g.player.x=1100;const before=g.companion.x;tick(g,.2);assert.equal(g.companion.x,before);
  g.companion.hp=0;tick(g,.1);assert.equal(g.companion.failed,true);assert.equal(g.companion.active,false);assert.equal(g.startEscort(),true);assert.equal(g.companion.hp,100);
});
test('nearby companion does not steal interactions from quest sites or father',()=>{
  const g=new Game();g.companion.joined=true;g.player.x=560;g.player.y=1260;g.companion.x=560;g.companion.y=1261;assert.equal(g.nearInteractable().id,'keeper');
});
test('resonance requires relationship progress and respects cooldown',()=>{
  const g=new Game();assert.equal(g.resonance(),false);g.acceptQuest();g.completeMemory('music');g.completeMemory('escort');g.player.hp=20;assert.equal(g.resonance(),true);assert.equal(g.player.hp,48);assert.equal(g.resonance(),false);
});
test('every story line has a valid character and actual local MP3',()=>{
  const ids=new Set();let total=0;for(const scene of Object.values(SCENES))for(const l of scene.lines){assert.ok(CAST[l.speaker]);assert.ok(l.text.length>5);assert.ok(Number.isFinite(l.x)&&Number.isFinite(l.y));assert.equal(ids.has(l.id),false);ids.add(l.id);assert.ok(fs.statSync(path.resolve(__dirname,'..',l.voice)).size>1000);total++;}assert.equal(total,38);
});
