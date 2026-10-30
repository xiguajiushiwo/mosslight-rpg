const test=require('node:test');
const assert=require('node:assert/strict');
const {Campaign,CAMP}=require('../src/journey-core.js');
const D=require('../src/journey-data.js');
const geometry=require('../src/journey-render.js');
const battleTypes=new Set(['battle','defend','boss']);
function quiet(g=new Campaign()){g.enemies=[];g.events=[];return g;}
function tick(g,seconds,input={}){for(let t=0;t<seconds-1e-6;t+=.02)g.step(Math.min(.02,seconds-t),input);}
function at(g,node){g.player.x=node.x;g.player.y=node.y;g.player.hp=g.player.maxHp;}
function clearBattle(g){let waves=0;while(g.combat&&waves++<8){for(const e of g.enemies)if(e.alive&&e.battleId)g.hitEnemy(e,999999,{weapon:'axe',element:'lightning'});g.step(.01);}assert.equal(g.combat,null,'all waves must terminate');}
function complete(g,node,choiceIndex=0){at(g,node);assert.equal(g.beginNode(node.id),true,node.id);if(battleTypes.has(node.type))clearBattle(g);const result=g.resolveNode(node.id,{answer:node.puzzle?.solution,choice:node.choices?.[choiceIndex]?.id});assert.equal(result.ok,true,node.id+': '+result.message);}
function advanceToBattle(){const g=quiet();while(!battleTypes.has(g.activeNode().type))complete(g,g.activeNode());at(g,g.activeNode());return g;}

test('all chapters and optional chains contain unique, valid reachable objectives',()=>{
  assert.equal(D.CHAPTERS.length,8);assert.equal(D.SIDEQUESTS.length,12);
  const ids=new Set(),lines=new Set();
  for(const chapter of D.CHAPTERS){assert.equal(chapter.nodes.length,6);assert.ok(chapter.nodes.filter(n=>battleTypes.has(n.type)).length>=2);}
  for(const q of D.SIDEQUESTS)assert.equal(q.nodes.length,3);
  for(const node of D.CHAPTERS.flatMap(c=>c.nodes).concat(D.SIDEQUESTS.flatMap(q=>q.nodes))){
    assert.equal(ids.has(node.id),false,node.id);ids.add(node.id);assert.ok(node.x>=45&&node.x<=2155&&node.y>=55&&node.y<=1555,node.id);
    if(node.puzzle){assert.ok(node.puzzle.solution.length>0);assert.ok(node.puzzle.labels.length>0);}
    for(const line of [...(node.lines||[]),...(node.after||[]),...(node.choices||[]).flatMap(c=>c.result||[])]){assert.ok(D.CAST[line.speaker],line.speaker);assert.ok(line.text.length>0);assert.equal(lines.has(line.id),false,line.id);lines.add(line.id);}
  }
});

test('all story approaches and resource pickups are reachable around actual houses and water',()=>{
  const g=new Campaign();g.buildings.add('house');const grid=25,cols=88,rows=64;
  for(let chapter=0;chapter<D.CHAPTERS.length;chapter++){
    g.loadRegion(chapter);const sx=Math.round(CAMP.x/grid),sy=Math.round(CAMP.y/grid),queue=[[sx,sy]],seen=new Set([sy*cols+sx]);
    for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=ny*cols+nx;if(nx<0||ny<0||nx>=cols||ny>=rows||seen.has(key)||g.solidAt(nx*grid,ny*grid,14))continue;seen.add(key);queue.push([nx,ny]);}}
    const targets=[...D.CHAPTERS[chapter].nodes,...D.SIDEQUESTS.filter(q=>q.chapter===chapter).flatMap(q=>q.nodes),...g.resources];
    for(const target of targets){const radius=target.kind?55:75;assert.ok(queue.some(([x,y])=>Math.hypot(x*grid-target.x,y*grid-target.y)<radius),'No approach: '+target.id);}
    for(const r of g.resources)assert.equal(g.solidAt(r.x,r.y,12),false,'resource inside obstacle '+r.id);for(const e of g.enemies)assert.equal(g.solidAt(e.x,e.y,e.r),false,'enemy inside obstacle '+e.id);
  }
});

test('fast movement cannot tunnel through house walls or harbor water; invalid loaded positions recover',()=>{
  const g=quiet(),wall=geometry.obstacles(0,g.buildings)[0];g.player.x=wall.x-40;g.player.y=wall.y+40;g.move(g.player,400,0);assert.ok(g.player.x<=wall.x-g.player.r);assert.equal(g.solidAt(g.player.x,g.player.y,g.player.r),false);
  g.chapter=4;g.player.x=800;g.player.y=220;g.move(g.player,0,-400);assert.ok(g.player.y>=172);g.chapter=0;const raw=g.serialize();raw.player.x=wall.x+50;raw.player.y=wall.y+40;const restored=Campaign.fromSave(raw);assert.ok(restored);assert.equal(restored.player.x,CAMP.x);assert.equal(restored.player.y,CAMP.y);
});

test('weapons have delayed damage, distinct reach and shell armor counterplay',()=>{
  const g=quiet(),p=g.player,e=g.makeEnemy('wolf','testwolf',p.x+100,p.y);e.speed=0;e.cooldown=10;g.enemies=[e];p.angle=0;p.weapon='sword';g.attack();assert.equal(e.hp,e.maxHp);tick(g,.19);assert.equal(e.hp,e.maxHp,'sword cannot reach distant target');tick(g,.4);p.stamina=100;p.weapon='spear';g.attack();tick(g,.25);assert.ok(e.hp<e.maxHp,'spear reaches target');
  const shell=g.makeEnemy('shell','testshell',p.x+40,p.y);const before=shell.hp;g.hitEnemy(shell,100,{weapon:'sword'});assert.equal(before-shell.hp,38);shell.hp=before;g.hitEnemy(shell,100,{weapon:'axe'});assert.equal(before-shell.hp,100);shell.hp=before;g.hitEnemy(shell,1,{element:'frost'});const frozen=shell.hp;g.hitEnemy(shell,50,{weapon:'sword'});assert.equal(frozen-shell.hp,50);
});

test('stamina limits attacks and rolls; release guarding restores stamina faster',()=>{
  const g=quiet(),p=g.player;p.stamina=10;assert.equal(g.attack(),false);assert.equal(g.dash(1,0),false);p.stamina=40;assert.equal(g.dash(1,0),true);assert.equal(p.stamina,15);assert.equal(g.dash(1,0),false);tick(g,1.5);assert.ok(p.stamina>15);p.stamina=20;p.staminaDelay=0;tick(g,1,{block:true});const guarded=p.stamina;p.stamina=20;tick(g,1,{block:false});assert.ok(p.stamina>guarded+10);
});

test('guard timing and direction matter; a fresh parry staggers its attacker',()=>{
  const g=quiet(),p=g.player,e=g.makeEnemy('wolf','parrywolf',p.x+40,p.y);p.angle=0;g.block(true);const hp=p.hp;g.hurt(24,e);assert.equal(p.hp,hp);assert.equal(g.stats.parries,1);assert.ok(e.stunned>0);
  p.invulnerable=0;p.guardAge=.4;g.hurt(24,e);assert.equal(p.hp,hp-6,'late guard reduces instead of negating damage');p.invulnerable=0;p.action=null;e.x=p.x-40;g.hurt(24,e);assert.equal(p.hp,hp-30,'attack from behind bypasses guard');
});

test('magic consumes mana on valid casts and fire, frost and rain lightning differ',()=>{
  const g=quiet(),p=g.player;p.mp=10;assert.equal(g.cast(),false);p.mp=70;p.stamina=100;assert.equal(g.cast(),true);assert.equal(p.mp,52);assert.equal(g.cast(),false);tick(g,.7);assert.ok(g.projectiles.length>0);
  const e=g.makeEnemy('shell','element',p.x+40,p.y);g.hitEnemy(e,1,{element:'frost'});assert.equal(e.frost,5);g.hitEnemy(e,1,{element:'fire'});assert.ok(e.burn>0);
  const rainy=D.CHAPTERS.findIndex(c=>c.weather==='rain');assert.ok(rainy>=0);g.chapter=rainy;const a=g.makeEnemy('wolf','light1',p.x+100,p.y),b=g.makeEnemy('wolf','light2',p.x+240,p.y);g.enemies=[a,b];g.releaseSpell({spell:'lightning',angle:0});assert.ok(a.hp<a.maxHp&&b.hp<b.maxHp,'rain extends chain radius');
});

test('enemy variants advertise and execute different attack geometry',()=>{
  for(const [type,kind]of Object.entries({wolf:'charge',spitter:'spit',shell:'slam',burrow:'burrow',wisp:'fan'})){
    const g=quiet(),e=g.makeEnemy(type,type,g.player.x+50,g.player.y);g.enemyTelegraph(e);assert.equal(e.attackKind,kind);assert.ok(e.windup>0);assert.equal(e.attackX,g.player.x);if(type==='burrow')assert.equal(e.underground,true);g.enemyStrike(e);assert.equal(e.underground,false);if(['spitter','wisp'].includes(type))assert.ok(g.projectiles.length>0);
  }
  const g=quiet(),boss=g.makeEnemy('boss','boss',700,1000),kinds=[];for(let i=0;i<3;i++){g.enemyTelegraph(boss);kinds.push(boss.attackKind);g.enemyStrike(boss);}assert.deepEqual(kinds,['slam','fan','charge']);
});

test('traps and companion resonance provide tactical control with actual costs',()=>{
  const g=quiet(),p=g.player,e=g.makeEnemy('wolf','trapwolf',p.x+35,p.y);g.enemies=[e];p.angle=0;const count=g.inventory.trap;assert.equal(g.placeTrap(),true);assert.equal(g.inventory.trap,count-1);tick(g,.02);assert.equal(g.traps.length,0);assert.ok(e.stunned>2);assert.ok(e.hp<e.maxHp);
  g.bond=2;p.hp=50;assert.equal(g.resonance(),true);assert.ok(p.hp>50);assert.equal(g.resonance(),false);assert.ok(p.resonanceCooldown>0);
});

test('story order, puzzle solutions and combat completion are enforced',()=>{
  const g=quiet(),later=D.CHAPTERS[0].nodes[2];at(g,later);assert.equal(g.beginNode(later.id),false);assert.equal(g.resolveNode(later.id).ok,false);
  let puzzle=null;for(let chapter=0;chapter<D.CHAPTERS.length&&!puzzle;chapter++){while(g.activeNode()){const n=g.activeNode();if(n.puzzle){puzzle=n;break;}complete(g,n);}if(!puzzle)g.travel(chapter+1);}
  assert.ok(puzzle);at(g,puzzle);g.beginNode(puzzle.id);assert.equal(g.resolveNode(puzzle.id,{answer:[]}).ok,false);assert.equal(g.resolveNode(puzzle.id,{answer:puzzle.puzzle.solution,choice:puzzle.choices?.[0]?.id}).ok,true);const xp=g.player.xp,coins=g.player.coins;assert.equal(g.resolveNode(puzzle.id,{answer:puzzle.puzzle.solution}).ok,false);assert.equal(g.player.xp,xp);assert.equal(g.player.coins,coins);
  const battle=advanceToBattle(),n=battle.activeNode();battle.beginNode(n.id);assert.equal(battle.resolveNode(n.id).ok,false);assert.equal(battle.travel(1),false);clearBattle(battle);assert.ok(battle.battleReady.has(n.id));assert.equal(battle.completed.has(n.id),false);
});

test('cleared combat checkpoint survives reload and awards only once',()=>{
  const g=advanceToBattle(),node=g.activeNode();g.beginNode(node.id);clearBattle(g);const reloaded=Campaign.fromSave(g.serialize());assert.ok(reloaded);assert.ok(reloaded.battleReady.has(node.id));at(reloaded,node);assert.equal(reloaded.beginNode(node.id),true);assert.equal(reloaded.combat,null);assert.equal(reloaded.resolveNode(node.id,{choice:node.choices?.[0]?.id}).ok,true);assert.equal(reloaded.resolveNode(node.id).ok,false);
});

test('partial battle save preserves defeated enemies and retry does not duplicate kill rewards',()=>{
  const g=advanceToBattle(),node=g.activeNode();g.beginNode(node.id);const foe=g.enemies.find(e=>e.battleId);g.hitEnemy(foe,999999,{weapon:'axe'});const coins=g.player.coins,kills=g.stats.kills;let r=Campaign.fromSave(g.serialize());assert.ok(r);assert.equal(r.enemies.find(e=>e.id===foe.id).alive,false);r.dead=true;r.revive();assert.equal(r.combat,null);at(r,node);r.beginNode(node.id);const retry=r.enemies.find(e=>e.id===foe.id);assert.equal(retry.alive,true);r.hitEnemy(retry,999999,{weapon:'axe'});assert.equal(r.stats.kills,kills);assert.equal(r.player.coins,Math.floor(coins*.9));
});

test('an early multi-enemy objective is survivable through real movement, spells, melee and dodging',()=>{
  const g=advanceToBattle(),node=g.activeNode();g.beginNode(node.id);g.cycleWeapon();let frames=0;
  for(;frames<7200&&g.combat&&!g.dead;frames++){
    const p=g.player,alive=g.enemies.filter(e=>e.alive),enemy=alive.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!enemy)break;
    const dx=enemy.x-p.x,dy=enemy.y-p.y,d=Math.hypot(dx,dy),desired=p.stamina<28?150:90,sign=d>desired?1:-1;
    if(alive.some(e=>e.windup>0&&e.windup<.22&&Math.hypot(e.attackX-p.x,e.attackY-p.y)<100))g.dash(-dy,dx);
    if(p.hp<p.maxHp*.45&&p.potions)g.useItem('potion');
    g.step(1/60,{right:dx*sign>8,left:dx*sign< -8,down:dy*sign>8,up:dy*sign< -8,attack:d<122&&p.stamina>=30,magic:d<360&&p.mp>=18&&p.stamina>=32});
  }
  assert.equal(g.dead,false,'starting kit must survive a reasonable kite-and-counter strategy');assert.equal(g.combat,null,'encounter should resolve without directly changing enemy health');assert.ok(g.battleReady.has(node.id));
  console.log('Actual-input encounter:',Math.round(frames/60)+'s simulated,',Math.round(g.player.hp),'HP remaining,',g.player.potions,'potions.');
});

test('defense objectives direct attacks at the lantern and can be retried after failure',()=>{
  const g=quiet();let node=null;for(let chapter=0;chapter<D.CHAPTERS.length&&!node;chapter++){while(g.activeNode()){const n=g.activeNode();if(n.type==='defend'){node=n;break;}complete(g,n);}if(!node)g.travel(chapter+1);}
  assert.ok(node);at(g,node);g.beginNode(node.id);assert.equal(g.combat.integrity,100);g.player.x=45;g.player.y=1500;const enemy=g.enemies.find(e=>e.battleId===node.id);g.enemyTelegraph(enemy);assert.equal(enemy.attackX,node.x);assert.equal(enemy.attackY,node.y);g.damageDefense(40);const r=Campaign.fromSave(g.serialize());assert.ok(r);assert.equal(r.combat.integrity,60);g.damageDefense(70);assert.equal(g.combat,null);assert.equal(g.completed.has(node.id),false);at(g,node);assert.equal(g.beginNode(node.id),true);assert.equal(g.combat.integrity,100);
});

test('standing between a projectile and the lantern intercepts damage, guarding protects nearby supplies',()=>{
  const g=quiet();let node=null;for(let chapter=0;chapter<D.CHAPTERS.length&&!node;chapter++){while(g.activeNode()){const n=g.activeNode();if(n.type==='defend'){node=n;break;}complete(g,n);}if(!node)g.travel(chapter+1);}
  at(g,node);g.beginNode(node.id);g.player.invulnerable=0;g.projectiles=[{x:node.x-25,y:node.y,vx:185,vy:0,r:7,life:2,hostile:true,damage:14,defense:true}];const hp=g.player.hp;g.step(.05);assert.ok(g.player.hp<hp);assert.equal(g.combat.integrity,100,'the player must intercept the shot before the beacon does');g.player.action=null;g.block(true);const stamina=g.player.stamina;g.damageDefense(20);assert.equal(g.combat.integrity,95);assert.ok(g.player.stamina<stamina);
});

test('hold-line choice protects lantern integrity without removing enemies',()=>{
  const g=quiet();let node=null;for(let chapter=0;chapter<D.CHAPTERS.length&&!node;chapter++){while(g.activeNode()){const n=g.activeNode();if(n.type==='defend'){node=n;break;}complete(g,n);}if(!node)g.travel(chapter+1);}
  at(g,node);g.flags.add('hold_line');g.beginNode(node.id);assert.equal(g.enemies.filter(e=>e.battleId===node.id).length,node.enemies.length);g.damageDefense(20);assert.equal(g.combat.integrity,89);g.block(true);const stamina=g.player.stamina;g.damageDefense(20);assert.equal(g.combat.integrity,86.25);assert.equal(g.player.stamina,stamina-6);
});

test('final defense without reinforcements is winnable by normal inputs and still fails if abandoned',()=>{
  const id='ridge_lastnight';let g=quiet();
  // Only setup skips earlier fights; it still obtains their actual XP and resources.
  // The reviewed final encounter below uses no direct enemy-health modification.
  while(g.activeNode()?.id!==id){const n=g.activeNode();if(!n){assert.equal(g.travel(g.chapter+1),true);g.enemies=[];continue;}complete(g,n,n.choices?.length>1?1:0);}
  g.player.x=CAMP.x;g.player.y=CAMP.y;g.build('workshop');g.build('house');g.rest();let points=0;
  while(g.skillPoints&&points++<100)g.learnTalent(['fire','heart','blade'][(points-1)%3]);
  while(g.player.potions<6&&g.inventory.herb>=3)g.craft('potion');g.craft('tea');g.craft('tea');g.craft('stew');g.craft('roast');g.useItem('roast');g.cycleWeapon();
  const node=g.activeNode();at(g,node);assert.ok(g.flags.has('hold_line'));assert.equal(g.flags.has('share_burden'),false);g.beginNode(node.id);assert.equal(g.enemies.filter(e=>e.battleId===id).length,4);
  const abandoned=Campaign.fromSave(g.serialize());assert.ok(abandoned);abandoned.player.x=CAMP.x;abandoned.player.y=CAMP.y;
  let frames=0,lowestIntegrity=100;
  for(;frames<9000&&g.combat&&!g.dead;frames++){
    const p=g.player,alive=g.enemies.filter(e=>e.alive),enemy=alive.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!enemy)break;
    const dx=enemy.x-p.x,dy=enemy.y-p.y,d=Math.hypot(dx,dy);lowestIntegrity=Math.min(lowestIntegrity,g.combat.integrity);
    if(p.hp<p.maxHp*.55){if(g.inventory.stew)g.useItem('stew');else if(p.potions)g.useItem('potion');}
    if(p.mp<20&&g.inventory.tea)g.useItem('tea');if(p.hp<p.maxHp*.8||alive.length>2)g.resonance();
    const weapon=enemy.type==='shell'?'axe':'spear';for(let i=0;i<3&&p.weapon!==weapon&&!p.action;i++)g.cycleWeapon();
    const imminent=alive.find(e=>e.windup>0&&e.windup<.23&&Math.hypot(e.attackX-p.x,e.attackY-p.y)<120),guard=!!imminent&&!p.action,cx=node.x-p.x,cy=node.y-p.y;
    if(frames%300===0&&g.inventory.trap&&d<130)g.placeTrap();
    g.step(1/60,{right:cx>15,left:cx< -15,down:cy>15,up:cy< -15,block:guard,attack:!guard&&d<g.weaponStats().range+enemy.r-8&&p.stamina>=30,magic:!guard&&d<360&&p.mp>=18&&p.stamina>=32});
  }
  assert.equal(g.dead,false);assert.ok(g.battleReady.has(id),'normal combat must clear all three waves');assert.ok(lowestIntegrity>0&&lowestIntegrity<50,'defending still carries meaningful risk');
  for(let i=0;i<9000&&abandoned.combat;i++)abandoned.step(1/60,{});
  assert.equal(abandoned.combat,null);assert.equal(abandoned.battleReady.has(id),false);assert.ok(abandoned.events.some(e=>e.type==='battleFailed'),'leaving the lantern unattended must still fail');
  console.log('Hold-line defense:',Math.round(frames/60)+'s simulated,',Math.round(lowestIntegrity)+'% lantern minimum,',g.player.potions,'potions left; unattended defense fails.');
});

test('camp crafting, construction and farming consume resources without main-story locks',()=>{
  const g=quiet(),p=g.player;g.inventory.grain=5;g.inventory.mushroom=5;const before={...g.inventory};assert.equal(g.craft('stew'),true);assert.equal(g.inventory.stew,1);for(const [id,cost]of Object.entries(D.RECIPES.stew.cost))assert.equal(g.inventory[id],before[id]-cost);p.hp=10;assert.equal(g.useItem('stew'),true);assert.ok(p.hp>10);assert.equal(g.inventory.stew,0);
  g.inventory.wood=99;g.inventory.ore=99;assert.equal(g.build('workshop'),true);assert.equal(p.maxStamina,115);assert.equal(g.build('workshop'),false);assert.equal(g.plant(0),true);assert.equal(g.harvest(0),false);g.rest();g.rest();assert.equal(g.harvest(0),true);assert.equal(g.harvest(0),false);p.x=1000;assert.equal(g.craft('tea'),false);assert.equal(g.rest(),false);
});

test('talent budget, derived stats and guarded save validation survive reload',()=>{
  const g=quiet();assert.equal(g.learnTalent('heart'),false);g.addXP(200);const max=g.player.maxHp;assert.equal(g.learnTalent('heart'),true);assert.equal(g.player.maxHp,max+18);let restored=Campaign.fromSave(g.serialize());assert.ok(restored);assert.equal(restored.player.maxHp,g.player.maxHp);assert.equal(restored.talents.heart,1);
  const raw=g.serialize();assert.equal(Campaign.fromSave({...raw,version:99}),null);assert.equal(Campaign.fromSave({...raw,unlocked:7}),null);assert.equal(Campaign.fromSave({...raw,player:{...raw.player,hp:NaN}}),null);assert.equal(Campaign.fromSave({...raw,progress:[99,0,0,0,0,0,0,0]}),null);
  restored=Campaign.fromSave({...raw,player:{...raw.player,x:-1000,y:99999}});assert.ok(restored.player.x>=45&&restored.player.y<=1555);
});

test('all earned late-game talent points remain spendable and allocated ranks persist',()=>{
  const g=quiet();g.addXP(1000000);assert.equal(g.player.level,30);let spent=0;for(const id of ['blade','fire','heart'])while(g.learnTalent(id))spent++;assert.equal(spent,29);assert.equal(g.skillPoints,0);assert.equal(g.talents.blade,10);assert.equal(g.talents.fire,10);assert.equal(g.talents.heart,9);const r=Campaign.fromSave(g.serialize());assert.ok(r);assert.deepEqual(r.talents,g.talents);
});

test('resource harvest and defeated wildlife stay changed when returning to an earlier region',()=>{
  const g=new Campaign(),resource=g.resources[0],wild=g.enemies[0];at(g,resource);assert.equal(g.interact().kind,'resource');g.hitEnemy(wild,999999,{element:'lightning'});for(const e of g.enemies)e.alive=false;
  while(g.activeNode())complete(g,g.activeNode());assert.equal(g.travel(1),true);assert.equal(g.travel(0),true);assert.equal(g.resources.find(r=>r.id===resource.id).harvested,true);assert.equal(g.enemies.find(e=>e.id===wild.id).alive,false);const r=Campaign.fromSave(g.serialize());assert.ok(r);assert.equal(r.resources.find(x=>x.id===resource.id).harvested,true);
});

test('branch mechanics change support and defense; saving keeps deployed traps',()=>{
  const g=advanceToBattle(),node=g.activeNode();g.beginNode(node.id);const initial=g.enemies.filter(e=>e.battleId===node.id).length;g.combat=null;g.flags.add('share_burden');g.beginNode(node.id);const helped=g.enemies.filter(e=>e.battleId===node.id).length;if(initial>2)assert.equal(helped,initial-1);
  const p=g.player;p.invulnerable=0;const hp=p.hp;g.flags.add('hold_line');g.hurt(20,{x:p.x+30,y:p.y});assert.equal(p.hp,hp-18);p.action=null;p.angle=0;assert.equal(g.placeTrap(),true);const restored=Campaign.fromSave(g.serialize());assert.ok(restored);assert.equal(restored.traps.length,1);assert.equal(restored.traps[0].r,35);
});

test('active time excludes standing idle at camp and pause has no implicit time advancement',()=>{
  const g=quiet();tick(g,5);assert.equal(g.elapsed,0);tick(g,1,{right:true});assert.ok(g.elapsed>.9&&g.elapsed<1.1);const t=g.elapsed;g.serialize();assert.equal(g.elapsed,t);
});

test('entire eight-chapter route, twelve side chains and both branch memories survive reload',()=>{
  let g=quiet();let main=0,side=0;
  for(let chapter=0;chapter<D.CHAPTERS.length;chapter++){
    if(chapter){assert.equal(g.travel(chapter),true);g.enemies=[];}
    for(const q of D.SIDEQUESTS.filter(q=>q.chapter===chapter))for(const n of q.nodes){complete(g,n,(side++)%Math.max(1,n.choices?.length||1));g=Campaign.fromSave(g.serialize());assert.ok(g);g.enemies=g.enemies.filter(e=>e.battleId);}
    while(g.activeNode()){const n=g.activeNode();complete(g,n,(main++)%Math.max(1,n.choices?.length||1));const before=g.serialize();g=Campaign.fromSave(before);assert.ok(g,'failed reload after '+n.id);assert.deepEqual([...g.flags].sort(),before.flags.sort());g.enemies=g.enemies.filter(e=>e.battleId);}
  }
  assert.equal(main,48);assert.equal(side,36);assert.equal(g.completed.size,84);assert.equal(g.finished,true);assert.ok(g.stats.battles>=16);assert.ok(g.bond>0||g.trust>0);assert.ok(Object.keys(g.choices).length>=8);const finished=Campaign.fromSave(g.serialize());assert.equal(finished.finished,true);assert.equal(finished.travel(0),true);assert.equal(finished.progress[0],6);
  console.log('Journey graph verified:',main,'main objectives,',side,'side stages,',g.stats.battles,'battles. Not a human-duration measurement.');
});
