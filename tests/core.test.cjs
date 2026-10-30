const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/core.js');
const {Game,distance,solidAt,CHESTS,NPCS,BEACON}=C;

function quiet(g){g.enemies.forEach(e=>e.alive=false);g.events=[];return g;}
function tick(g,seconds,input={}){for(let t=0;t<seconds;t+=1/60)g.step(1/60,input);}
function route(g,target){
  const step=18,cols=Math.floor(C.W/step),rows=Math.floor(C.H/step),sx=Math.round(g.player.x/step),sy=Math.round(g.player.y/step);
  const queue=[[sx,sy]],seen=new Set([sy*cols+sx]),parents=new Map();let end=null;
  for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i],key=y*cols+x;
    if(Math.hypot(x*step-target.x,y*step-target.y)<48){end=key;break;}
    for(const [dx,dy]of [[0,1],[1,0],[0,-1],[-1,0]]){const nx=x+dx,ny=y+dy,nk=ny*cols+nx;if(nx<1||ny<1||nx>=cols-1||ny>=rows-1||seen.has(nk)||solidAt(nx*step,ny*step,17,g.quest))continue;seen.add(nk);parents.set(nk,key);queue.push([nx,ny]);}
  }
  assert.notEqual(end,null,'No walkable route to '+(target.id||JSON.stringify(target)));
  const points=[];for(let k=end;k!==sy*cols+sx;k=parents.get(k)){points.push({x:(k%cols)*step,y:Math.floor(k/cols)*step});}return points.reverse();
}
test('all quest destinations are reachable on foot, crossing only the bridge',()=>{
  const g=new Game();g.acceptQuest();
  for(const target of [...CHESTS,...NPCS,...C.STORY_SITES,C.ESCORT_GOAL])assert.ok(route(g,target).length>0);
  assert.equal(solidAt(2000,450,11,1),true);assert.equal(solidAt(2000,450,11,2),false);
  assert.equal(C.inWater(1135,820,11),false);assert.equal(C.inWater(1000,820,11),true);
});
test('every enemy spawns on clear ground rather than inside trees or water',()=>{
  for(const e of new Game().enemies)assert.equal(solidAt(e.x,e.y,e.r,2),false,e.id+' has a blocked spawn');
});
test('movement normalizes diagonals and does not tunnel across a river',()=>{
  const a=quiet(new Game()),b=quiet(new Game());a.player.x=b.player.x=1100;a.player.y=b.player.y=1300;
  tick(a,.2,{right:true});tick(b,.2,{right:true,up:true});
  assert.ok(Math.abs(distance(a.player,{x:1100,y:1300})-distance(b.player,{x:1100,y:1300}))<.01);
  a.player.x=600;a.player.y=940;a.move(a.player,0,-300);assert.ok(a.player.y>=891);
});
test('melee rewards a kill once and attack cooldown prevents duplicate hits',()=>{
  const g=quiet(new Game()),e=g.enemies[0];e.alive=true;e.x=g.player.x+30;e.y=g.player.y;e.hp=30;
  assert.equal(g.attack(),true);assert.equal(e.hp,30,'windup must not damage');assert.equal(g.attack(),false);
  tick(g,.2);assert.equal(e.hp,6);tick(g,.3);g.attack();tick(g,.2);assert.equal(e.alive,false);assert.equal(g.kills,1);assert.equal(g.player.coins,5);
  g.hitEnemy(e,999);assert.equal(g.kills,1);assert.equal(g.player.coins,5);
});
test('spells consume mana only on successful casts and hit enemies',()=>{
  const g=quiet(new Game()),e=g.enemies[0];e.alive=true;e.x=g.player.x+100;e.y=g.player.y;
  assert.equal(g.cast(),true);assert.equal(g.player.mp,45);assert.equal(g.cast(),false);tick(g,.6);assert.ok(!e.alive||e.hp<e.maxHp);
  g.player.mp=0;g.player.spellCooldown=0;assert.equal(g.cast(),false);assert.equal(g.player.mp,0);
});
test('invulnerability prevents repeated damage and potions cannot be wasted at full health',()=>{
  const g=new Game();assert.equal(g.potion(),false);assert.equal(g.player.potions,3);
  g.hurt(20);g.hurt(20);assert.equal(g.player.hp,80);assert.equal(g.potion(),true);assert.equal(g.player.hp,100);assert.equal(g.player.potions,2);
  g.player.invulnerable=0;g.dash(1,0);g.hurt(40);assert.equal(g.player.hp,100);
});
test('three different story activities unlock the sword and ending in order',()=>{
  const g=quiet(new Game());assert.equal(g.turnIn(),false);g.acceptQuest();
  assert.equal(g.completeMemory('stars'),false);g.musicNote(0);g.musicNote(2);assert.equal(g.musicNote(1),true);assert.equal(g.musicNote(1),false);
  assert.equal(g.startEscort(),true);g.player.x=C.ESCORT_GOAL.x;g.player.y=C.ESCORT_GOAL.y;g.companion.x=C.ESCORT_GOAL.x;g.companion.y=C.ESCORT_GOAL.y;tick(g,.1);
  g.mirrors=[1,0,3];assert.equal(g.alignStars(),true);assert.equal(g.alignStars(),false);
  assert.equal(g.memories.size,3);assert.equal(g.turnIn(),true);assert.equal(g.quest,2);assert.equal(g.player.sword,true);assert.equal(g.turnIn(),false);
  const boss=g.enemies.find(e=>e.type==='boss');boss.alive=true;g.hitEnemy(boss,999);assert.equal(g.quest,3);
  g.player.x=BEACON.x;g.player.y=BEACON.y+35;g.interact();assert.equal(g.quest,4);assert.equal(g.events.filter(e=>e.type==='win').length,1);g.interact();assert.equal(g.events.filter(e=>e.type==='win').length,1);
});
test('level thresholds grant permanent stats and refill health and mana',()=>{
  const g=new Game();g.player.hp=10;g.player.mp=0;g.addXP(56);assert.equal(g.player.level,2);assert.equal(g.player.xp,0);assert.equal(g.player.hp,114);assert.equal(g.player.mp,66);assert.equal(g.talentPoints,1);assert.equal(g.damage,28);
});
test('death is emitted once and returning to village preserves progress',()=>{
  const g=new Game();g.acceptQuest();g.player.coins=50;g.hurt(200);g.hurt(200);assert.equal(g.events.filter(e=>e.type==='death').length,1);g.revive();assert.equal(g.dead,false);assert.equal(g.player.coins,45);assert.equal(g.quest,1);assert.equal(g.player.hp,100);assert.equal(g.player.x,610);
});
test('save round-trip preserves progression, opened loot and equipment',()=>{
  const g=new Game();g.quest=2;g.memories=new Set(['music','escort','stars']);g.stones=3;g.player.sword=true;g.player.level=3;g.player.maxHp=128;g.player.hp=97;g.player.coins=86;
  const saved=Game.fromSave(JSON.parse(JSON.stringify(g.serialize())));assert.ok(saved);assert.equal(saved.quest,2);assert.equal(saved.stones,3);assert.equal(saved.player.sword,true);assert.equal(saved.player.hp,97);assert.equal(saved.player.coins,86);
});
test('corrupt or impossible saves are rejected and blocked positions repaired',()=>{
  assert.equal(Game.fromSave(null),null);const base=new Game().serialize();assert.equal(Game.fromSave({...base,version:99}),null);
  assert.equal(Game.fromSave({...base,quest:3}),null);assert.equal(Game.fromSave({...base,player:{...base.player,hp:NaN}}),null);
  const repaired=Game.fromSave({...base,player:{...base.player,x:500,y:820}});assert.equal(repaired.player.x,610);assert.equal(repaired.player.y,1340);
});
test('story campaign walks every location, escorts Suwan, solves puzzles and reloads ending',()=>{
  const g=new Game();g.acceptQuest();let steps=0;
  function walk(target){
    const points=route(g,target);
    for(const point of points){let guard=0;while(distance(g.player,point)>5&&guard++<150){
      const dx=point.x-g.player.x,dy=point.y-g.player.y,near=g.nearestEnemy(170);g.step(1/60,{right:dx>3,left:dx< -3,down:dy>3,up:dy< -3,attack:!!near&&distance(near,g.player)<95,magic:!!near});
      if(g.player.hp<g.player.maxHp*.5&&g.player.potions)g.potion();assert.equal(g.dead,false,'bot died while walking');steps++;
    }assert.ok(guard<150,'stuck on route at '+JSON.stringify(point)+' player '+JSON.stringify({x:g.player.x,y:g.player.y})+' trees '+JSON.stringify(C.SCENERY.trees.filter(t=>distance(t,g.player)<65)));}
  }
  function clearNearby(target){for(let i=0;i<3000&&g.enemies.some(e=>e.alive&&distance(e,target)<98);i++){
    g.step(1/60,{attack:true,magic:true});if(g.player.hp<g.player.maxHp*.5&&g.player.potions)g.potion();assert.equal(g.dead,false,'bot died in combat');steps++;
  }assert.equal(g.enemies.some(e=>e.alive&&distance(e,target)<98),false,'enemy did not clear');}
  walk(CHESTS.find(c=>c.id==='village'));g.interact();
  walk(C.STORY_SITES[0]);g.musicNote(0);g.musicNote(2);g.musicNote(1);assert.ok(g.memories.has('music'));
  walk(NPCS.find(n=>n.id==='suwan'));g.startEscort();walk({x:1135,y:1050});walk(C.ESCORT_GOAL);
  for(let i=0;i<900&&!g.memories.has('escort');i++){const e=g.nearestEnemy(150);g.step(1/60,{attack:!!e&&distance(e,g.player)<90,magic:!!e});if(g.player.hp<60)g.potion();}
  assert.ok(g.memories.has('escort'),'escort did not finish: '+JSON.stringify(g.companion)+' player '+g.player.x+','+g.player.y);
  walk(C.STORY_SITES[1]);g.mirrors=[1,0,3];g.alignStars();assert.equal(g.memories.size,3);
  walk(NPCS[0]);assert.equal(g.turnIn(),true);g.rest();g.learnTalent('heart');g.learnTalent('blade');g.learnTalent('fire');
  const boss=g.enemies.find(e=>e.type==='boss');walk({x:boss.homeX,y:boss.homeY+75});
  for(let i=0;i<6000&&boss.alive;i++){g.step(1/60,{attack:true,magic:true});if(g.player.hp<g.player.maxHp*.5){g.resonance();if(g.player.potions)g.potion();}assert.equal(g.dead,false,'bot died against guardian');steps++;}
  assert.equal(boss.alive,false);assert.equal(g.quest,3);walk(BEACON);g.interact();assert.equal(g.quest,4);
  const loaded=Game.fromSave(g.serialize());assert.ok(loaded);assert.equal(loaded.quest,4);assert.equal(loaded.enemies.find(e=>e.type==='boss').alive,false);
  console.log('Campaign:',Math.round(g.elapsed)+'s simulated,',steps,'frames, level',g.player.level,', HP',Math.round(g.player.hp),', potions',g.player.potions);
});
