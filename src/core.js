(function (root) {
  'use strict';
  const W = 2304, H = 1728, SAVE_VERSION = 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function seeded(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
  const NPCS = [
    { id: 'keeper', name: '父亲 · 林远', x: 550, y: 1240, type: 'father' },
    { id: 'merchant', name: '草药师 · 米娅', x: 800, y: 1300, type: 'merchant' },
    { id: 'suwan', name: '提灯人 · 苏晚', x: 1550, y: 1160, type: 'suwan' }
  ];
  const CHESTS = [
    { id: 'village', x: 335, y: 1370, stone: false, name: '旅人的行囊' },
    { id: 'northeast', x: 1630, y: 650, stone: false, name: '遗落的箱子' }
  ];
  const STORY_SITES=[{id:'music',x:430,y:480,type:'memory',name:'母亲的音乐盒'}, {id:'stars',x:1410,y:360,type:'memory',name:'旧塔星图'}];
  const MEMORY_ORDER=['music','escort','stars'];
  const ESCORT_GOAL={x:1135,y:930};
  const TALENTS={blade:{name:'剑心',description:'每级攻击 +6，第三击更有力量。'},fire:{name:'流萤',description:'每级法术 +10，二级发射双束萤火。'},heart:{name:'守望',description:'每级生命 +20，同行共鸣恢复更多生命。'}};
  const BEACON = { id: 'beacon', x: 2010, y: 235, name: '古林灯塔', type: 'beacon' };
  const FIRE = { x: 630, y: 1260 };
  const HOUSE_RECTS = [
    { x: 350, y: 1130, w: 120, h: 85 }, { x: 710, y: 1140, w: 130, h: 85 },
    { x: 450, y: 1440, w: 130, h: 90 }
  ];
  function nearPath(x, y, extra = 0) {
    return (Math.abs(y - 1330) < 80 + extra && x < 1150) ||
      (Math.abs(x - 1135) < 65 + extra && y > 450) ||
      (Math.abs(y - 1050) < 55 + extra && x > 1110 && x < 1640) ||
      (Math.abs(y - 485) < 60 + extra && x > 400 && x < 1990) ||
      (Math.abs(x - 2005) < 55 + extra && y < 690) ||
      (Math.abs(x - 1410) < 55 + extra && y > 320 && y < 500);
  }
  function makeScenery() {
    const rng = seeded(70621), trees = [], rocks = [], flowers = [];
    const excludes = [...NPCS, ...CHESTS, ...STORY_SITES, FIRE, BEACON, { x: 610, y: 1340 }];
    for (let i = 0; i < 560; i++) {
      const x = 50 + rng() * (W - 100), y = 50 + rng() * (H - 100);
      if (nearPath(x, y, 23) || (y > 735 && y < 925) || (x > 1780 && y < 700) ||
        (x > 260 && x < 910 && y > 1080 && y < 1540) || excludes.some(p => Math.hypot(p.x - x, p.y - y) < 100)) continue;
      if (trees.some(p => Math.hypot(p.x - x, p.y - y) < 50)) continue;
      trees.push({ x: Math.round(x), y: Math.round(y), size: 0.78 + rng() * .6, variant: Math.floor(rng() * 4) });
    }
    for (let i = 0; i < 100; i++) {
      const x = 70 + rng() * (W - 140), y = 70 + rng() * (H - 140);
      if (nearPath(x, y, 35) || (y > 735 && y < 925) || (x > 1780 && y < 710) ||
        (x < 920 && y > 1050 && y < 1570) || excludes.some(p => Math.hypot(p.x-x,p.y-y)<85)) continue;
      rocks.push({ x, y, size: 9 + rng() * 12 });
    }
    for (let i = 0; i < 1700; i++) flowers.push({ x: rng() * W, y: rng() * H, color: Math.floor(rng() * 8), size: rng() });
    return { trees, rocks, flowers };
  }
  const SCENERY = makeScenery();
  function inWater(x, y, r = 0) { return y + r > 775 && y - r < 880 && !(x - r > 1065 && x + r < 1205); }
  function solidAt(x, y, r, quest) {
    if (x < 40+r || x > W-40-r || y < 50+r || y > H-40-r || inWater(x,y,r)) return true;
    if (quest < 2 && x+r > 1810 && x-r < 2210 && y+r > 130 && y-r < 650) return true;
    if (HOUSE_RECTS.some(o => x+r>o.x && x-r<o.x+o.w && y+r>o.y && y-r<o.y+o.h)) return true;
    if (SCENERY.trees.some(o => Math.hypot(x-o.x,y-o.y)<r+12*o.size)) return true;
    return SCENERY.rocks.some(o => Math.hypot(x-o.x,y-o.y)<r+o.size*.7);
  }
  const ENEMY_SEEDS = [
    ['s1','slime',1020,1180],['s2','slime',1220,1120],['s3','slime',1470,1230],['s4','slime',1620,1090],
    ['s5','slime',980,980],['s6','slime',1250,525],['s7','slime',990,600],['s8','slime',690,520],
    ['s9','slime',410,630],['s10','slime',510,400],['s11','slime',1250,400],['s12','slime',1500,460],
    ['w1','wolf',1580,990],['w2','wolf',1540,580],['w3','wolf',820,460],['w4','wolf',1370,300],
    ['w5','wolf',1730,485],['w6','wolf',1900,690],['w7','wolf',1500,1380],['boss','boss',2005,415]
  ];
  function makeEnemy([id,type,x,y]) {
    const boss = type==='boss', wolf=type==='wolf';
    return { id, type, x, y, homeX:x, homeY:y, r:boss?40:wolf?17:16, hp:boss?650:wolf?76:46,
      maxHp:boss?650:wolf?76:46, speed:boss?35:wolf?83:49, damage:boss?25:wolf?16:11,
      xp:boss?160:wolf?25:16, coins:boss?70:wolf?9:5, cooldown:1.2, windup:0, attackX:0,attackY:0,
      flash:0, alive:true, phase:0, seed:x+y };
  }
  class Game {
    constructor() {
      this.player={x:610,y:1340,r:11,hp:100,maxHp:100,mp:60,maxMp:60,level:1,xp:0,coins:0,potions:3,
        sword:false,angle:-Math.PI/2,attackCooldown:0,spellCooldown:0,dashCooldown:0,dashTime:0,
        dashX:0,dashY:0,invulnerable:0,walk:0,moving:false,action:null,combo:0,comboWindow:0,resonanceCooldown:0};
      this.quest=0; this.stones=0; this.opened=new Set(); this.killed=new Set();
      this.memories=new Set();this.seen=new Set();this.talents={blade:0,fire:0,heart:0};this.musicNotes=[];this.mirrors=[0,0,0];this.promise='sea';
      this.companion={x:1550,y:1160,hp:100,active:false,joined:false,failed:false,invulnerable:0,walk:0,moving:false};
      this.followPath=[];
      this.enemies=ENEMY_SEEDS.map(makeEnemy); this.projectiles=[]; this.effects=[];this.events=[];
      this.elapsed=0;this.kills=0;this.dead=false;this.bossStarted=false;this.hintCooldown=0;this.random=seeded(90210);
    }
    emit(type, detail={}) { this.events.push({type,...detail}); }
    get damage() { return 24+(this.player.level-1)*4+(this.player.sword?18:0)+this.talents.blade*6; }
    get xpNeeded() { return 38+this.player.level*18; }
    get talentPoints(){return Math.max(0,this.player.level-1-Object.values(this.talents).reduce((a,b)=>a+b,0));}
    get chapter(){return this.quest===0?0:this.quest>=2?4:!this.memories.has('music')?1:!this.memories.has('escort')?2:!this.memories.has('stars')?3:4;}
    get region() {
      const p=this.player;
      if (p.x>1790 && p.y<700) return '月痕遗迹';
      if (p.y>1080 && p.x<950) return '萤火村';
      if (p.y>735&&p.y<930) return '风语溪';
      if (p.y<735 && p.x<1050) return '暮萤林地';
      if (p.y<735) return '失落的旧路';
      return '苔影林地';
    }
    move(entity, dx, dy) {
      // Substeps prevent a dash or slow animation frame from crossing thin obstacles.
      const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/8));
      for(let i=0;i<steps;i++) {
        if(!solidAt(entity.x+dx/steps,entity.y,entity.r,this.quest)) entity.x+=dx/steps;
        if(!solidAt(entity.x,entity.y+dy/steps,entity.r,this.quest)) entity.y+=dy/steps;
      }
    }
    nearestEnemy(range) { return this.enemies.filter(e=>e.alive&&distance(e,this.player)<range&&(e.type!=='boss'||this.quest>=2)).sort((a,b)=>distance(a,this.player)-distance(b,this.player))[0]; }
    attack() {
      const p=this.player;if(this.dead||this.quest===4||p.attackCooldown>0||p.action||p.dashTime>0)return false;
      const target=this.nearestEnemy(95); if(target)p.angle=Math.atan2(target.y-p.y,target.x-p.x);
      p.combo=p.comboWindow>0?p.combo%3+1:1;p.comboWindow=1.2;
      const duration=p.combo===3?.65:.45,hitAt=p.combo===3?.24:.16;
      p.attackCooldown=duration;p.action={type:'attack',time:0,duration,hitAt,hit:false,angle:p.angle,combo:p.combo};
      this.emit('action',{name:['','斜斩','回身斩','破灯斩'][p.combo]});return true;
    }
    strike(action){
      const p=this.player,mult=action.combo===3?1.65:action.combo===2?1.15:1;
      this.effects.push({type:'slash',x:p.x,y:p.y,angle:action.angle,combo:action.combo,life:.28,maxLife:.28});
      this.emit('sound',{name:'slash'});this.move(p,Math.cos(action.angle)*12,Math.sin(action.angle)*12);
      for(const e of this.enemies) {
        const d=distance(p,e), angle=Math.atan2(e.y-p.y,e.x-p.x), diff=Math.atan2(Math.sin(angle-action.angle),Math.cos(angle-action.angle));
        if(e.alive&&d<72+e.r&&Math.abs(diff)<(action.combo===3?1.65:1.3)&&(e.type!=='boss'||this.quest>=2)) this.hitEnemy(e,Math.round(this.damage*mult),angle,action.combo===3?29:12);
      }
    }
    cast() {
      const p=this.player;if(this.dead||this.quest===4||p.spellCooldown>0||p.action||p.dashTime>0)return false;
      if(p.mp<15){this.notice('魔力不足，稍等片刻便会恢复');return false;}
      const target=this.nearestEnemy(450);if(target)p.angle=Math.atan2(target.y-p.y,target.x-p.x);
      p.mp-=15;p.spellCooldown=.8;p.action={type:'cast',time:0,duration:.58,hitAt:.32,hit:false,angle:p.angle};return true;
    }
    releaseSpell(action){
      const p=this.player;for(const offset of this.talents.fire>=2?[-.08,.08]:[0]){const a=action.angle+offset;
        this.projectiles.push({x:p.x+Math.cos(a)*24,y:p.y+Math.sin(a)*24-8,vx:Math.cos(a)*430,vy:Math.sin(a)*430,r:6,life:1.25,hostile:false,damage:38+p.level*6+this.talents.fire*10});}
      this.emit('sound',{name:'magic'});
    }
    dash(dx=0,dy=0) {
      const p=this.player;if(this.dead||this.quest===4||p.dashCooldown>0)return false;
      const len=Math.hypot(dx,dy);p.dashX=len?dx/len:Math.cos(p.angle);p.dashY=len?dy/len:Math.sin(p.angle);
      p.action=null;p.dashTime=.32;p.invulnerable=.38;p.dashCooldown=1.5;this.emit('sound',{name:'dash'});return true;
    }
    resonance(){
      const p=this.player;if(this.dead||!this.memories.has('escort')||p.resonanceCooldown>0)return false;
      p.resonanceCooldown=18;const amount=28+this.talents.heart*12;p.hp=Math.min(p.maxHp,p.hp+amount);this.companion.hp=Math.min(100,this.companion.hp+35);
      this.emit('float',{x:p.x,y:p.y-40,text:'同行 +'+amount,color:'#f1ccad'});this.emit('burst',{x:p.x,y:p.y,color:'#e4b3a8',count:32});this.emit('sound',{name:'levelup'});
      for(const e of this.enemies)if(e.alive&&distance(e,p)<135)this.hitEnemy(e,22+this.talents.heart*8);return true;
    }
    learnTalent(id){
      if(!TALENTS[id]||this.talentPoints<=0||this.talents[id]>=3)return false;this.talents[id]++;
      if(id==='heart'){this.player.maxHp+=20;this.player.hp=Math.min(this.player.maxHp,this.player.hp+20);}
      this.emit('sound',{name:'levelup'});this.emit('save');return true;
    }
    potion() {
      const p=this.player;if(this.dead)return false;
      if(p.potions<=0){this.notice('药水用完了，村里的米娅可以补给');return false;}
      if(p.hp>=p.maxHp){this.notice('生命已满，先留着药水吧');return false;}
      p.potions--;const healed=Math.min(p.maxHp-p.hp,60);p.hp+=healed;
      this.emit('float',{x:p.x,y:p.y-28,text:'+'+healed,color:'#b9dca2'});this.emit('sound',{name:'potion'});this.emit('save');return true;
    }
    hitEnemy(e,damage,angle=0,knockback=0) {
      if(!e.alive)return;
      e.hp-=damage;e.flash=.15;
      if(e.type!=='boss'&&knockback)this.move(e,Math.cos(angle)*knockback,Math.sin(angle)*knockback);
      this.emit('float',{x:e.x,y:e.y-20,text:String(damage),color:'#f3e8cb'});
      this.emit('burst',{x:e.x,y:e.y,color:e.type==='slime'?'#a2cf95':'#d7c796',count:8});
      if(e.hp<=0) {
        e.hp=0;e.alive=false;this.killed.add(e.id);this.kills++;this.player.coins+=e.coins;this.addXP(e.xp);
        this.emit('sound',{name:'kill'});this.emit('float',{x:e.x,y:e.y-40,text:'+'+e.xp+' 经验  ◈'+e.coins,color:'#e9c779'});
        if(this.random()<.16){this.player.potions++;this.emit('toast',{text:'拾取了一瓶林间药水'});}
        if(e.type==='boss') {this.quest=3;this.projectiles=this.projectiles.filter(p=>!p.hostile);this.emit('toast',{text:'旧日的树根松开了。与苏晚一起点亮灯塔。',gold:true});this.emit('quest');}
        this.emit('save');
      } else this.emit('sound',{name:'hit'});
    }
    addXP(amount) {
      const p=this.player;p.xp+=amount;
      while(p.xp>=this.xpNeeded) {
        p.xp-=this.xpNeeded;p.level++;p.maxHp=100+(p.level-1)*14+this.talents.heart*20;p.maxMp=60+(p.level-1)*6;p.hp=p.maxHp;p.mp=p.maxMp;
        this.emit('toast',{text:'Lv.'+p.level+' · 获得 1 天赋点 · 按 N 选择成长方向',gold:true});this.emit('sound',{name:'levelup'});
        this.emit('burst',{x:p.x,y:p.y,color:'#f2d38b',count:26});
      }
    }
    hurt(amount,source) {
      const p=this.player;if(p.invulnerable>0||this.dead)return;
      p.hp=Math.max(0,p.hp-amount);p.invulnerable=.8;
      p.action={type:'hurt',time:0,duration:.24,hit:true,angle:p.angle};
      this.emit('sound',{name:'hurt'});this.emit('shake',{amount:5});this.emit('float',{x:p.x,y:p.y-30,text:'−'+amount,color:'#e98273'});
      if(source) {const a=Math.atan2(p.y-source.y,p.x-source.x);this.move(p,Math.cos(a)*15,Math.sin(a)*15);}
      if(p.hp===0) {this.dead=true;this.emit('sound',{name:'lose'});this.emit('death');}
    }
    notice(text) {if(this.hintCooldown<=0){this.emit('toast',{text});this.hintCooldown=2;}}
    nearInteractable() {
      const items=[...NPCS.filter(n=>n.id!=='suwan'||(!this.companion.active&&!this.companion.joined)),...STORY_SITES,
        ...CHESTS.filter(c=>!this.opened.has(c.id)).map(c=>({...c,type:'chest'})),BEACON];
      if(this.companion.joined)items.push({id:'suwan',type:'suwan',name:'同行人 · 苏晚',x:this.companion.x,y:this.companion.y});
      const close=items.filter(i=>distance(i,this.player)<75).sort((a,b)=>distance(a,this.player)-distance(b,this.player));
      return close.find(i=>!(i.id==='suwan'&&this.companion.joined))||close[0]||null;
    }
    interact() {
      if(this.dead)return null;
      const item=this.nearInteractable();if(!item)return null;
      if(item.type==='memory'){
        if(this.quest===0){this.notice('先回家与父亲交谈吧');return null;}
        if(this.memories.has(item.id)){this.emit('replay',{scene:item.id});return null;}
        if(item.id==='stars'&&!this.memories.has('escort')){this.notice('星台还在沉睡。先去风语溪见见苏晚');return null;}
        return item;
      }
      if(item.type==='chest') {
        if(this.enemies.some(e=>e.alive&&distance(e,item)<95)){this.notice('先击退宝箱附近的敌人');return null;}
        this.opened.add(item.id);this.player.coins+=25;this.player.potions+=2;
        this.emit('toast',{text:'打开行囊 · 药水 +2 · 金币 +25',gold:true});
        this.emit('burst',{x:item.x,y:item.y,color:'#f2c86f',count:25});this.emit('sound',{name:'interact'});this.emit('quest');this.emit('save');
        return {type:'loot'};
      }
      if(item.id==='beacon') {
        if(this.quest===3) {this.quest=4;this.player.hp=this.player.maxHp;this.emit('sound',{name:'win'});this.emit('win');this.emit('save');return {type:'win'};}
        this.notice(this.quest===4?'灯火长明，欢迎随时回到森林。':'古老的树根仍缠绕着灯塔，先击败荒根守卫。');return null;
      }
      this.emit('sound',{name:'interact'});return item;
    }
    acceptQuest() {if(this.quest!==0)return false;this.quest=1;this.emit('quest');this.emit('save');return true;}
    completeMemory(id){
      const index=MEMORY_ORDER.indexOf(id);if(this.quest!==1||index<0||this.memories.has(id)||(index>0&&!this.memories.has(MEMORY_ORDER[index-1])))return false;
      this.memories.add(id);this.stones=this.memories.size;this.addXP(id==='escort'?55:45);this.player.coins+=15;
      this.emit('memory',{id});this.emit('quest');this.emit('save');return true;
    }
    musicNote(note){
      if(this.quest!==1||this.memories.has('music')||![0,1,2].includes(note))return false;
      const solution=[0,2,1];this.musicNotes.push(note);
      if(this.musicNotes.some((n,i)=>n!==solution[i])){this.musicNotes=note===0?[0]:[];this.emit('toast',{text:'雨落窗前 → 风过树林 → 灯火晚安，再听一次。'});return false;}
      if(this.musicNotes.length===3)return this.completeMemory('music');return false;
    }
    alignStars(){if(this.mirrors.join(',')!=='1,0,3'){this.notice('左镜向东，中镜向北，右镜向西。让三束光相遇。');return false;}return this.completeMemory('stars');}
    startEscort(){if(!this.memories.has('music')||this.memories.has('escort')||this.companion.active)return false;
      Object.assign(this.companion,{x:1550,y:1160,hp:100,active:true,joined:false,failed:false,invulnerable:2});this.followPath=[{x:this.player.x,y:this.player.y}];this.emit('save');return true;}
    turnIn() {
      if(this.quest!==1||this.memories.size<3)return false;
      this.quest=2;this.player.sword=true;this.player.potions+=2;this.player.hp=this.player.maxHp;this.player.mp=this.player.maxMp;this.addXP(45);
      this.emit('toast',{text:'接过父亲的月辉剑 · 攻击 +18 · 最后一段路，一起走',gold:true});this.emit('sound',{name:'levelup'});this.emit('quest');this.emit('save');return true;
    }
    buyPotion() {if(this.player.coins<12){this.notice('需要 12 枚金币');return false;}this.player.coins-=12;this.player.potions++;this.emit('sound',{name:'select'});this.emit('save');return true;}
    rest() {this.player.hp=this.player.maxHp;this.player.mp=this.player.maxMp;this.emit('sound',{name:'potion'});this.emit('save');}
    revive() {
      const p=this.player;p.x=610;p.y=1340;p.hp=p.maxHp;p.mp=p.maxMp;p.coins=Math.floor(p.coins*.9);p.invulnerable=2;p.dashTime=0;
      p.action=null;this.dead=false;this.bossStarted=false;this.projectiles=[];this.followPath=[];
      if(this.companion.active){this.companion.active=false;this.companion.failed=true;this.companion.hp=100;this.companion.x=1550;this.companion.y=1160;}
      if(this.companion.joined){this.companion.x=p.x+35;this.companion.y=p.y+20;}
      this.enemies=this.enemies.map(e=>e.alive?makeEnemy(ENEMY_SEEDS.find(s=>s[0]===e.id)):e);this.emit('save');
    }
    step(dt,input={}) {
      if(this.dead||this.quest===4)return;
      dt=clamp(dt,0,.05);this.elapsed+=dt;this.hintCooldown-=dt;const p=this.player;
      for(const key of ['attackCooldown','spellCooldown','dashCooldown','dashTime','invulnerable','comboWindow','resonanceCooldown']) p[key]=Math.max(0,p[key]-dt);
      if(p.action){const a=p.action;a.time+=dt;if(!a.hit&&a.time>=a.hitAt){a.hit=true;if(a.type==='attack')this.strike(a);if(a.type==='cast')this.releaseSpell(a);}if(a.time>=a.duration)p.action=null;}
      p.mp=Math.min(p.maxMp,p.mp+6*dt);
      if(distance(p,FIRE)<90&&!this.enemies.some(e=>e.alive&&distance(e,p)<220))p.hp=Math.min(p.maxHp,p.hp+12*dt);
      let dx=(input.right?1:0)-(input.left?1:0),dy=(input.down?1:0)-(input.up?1:0),len=Math.hypot(dx,dy);
      p.moving=len>0;
      if(p.dashTime>0){this.move(p,p.dashX*380*dt,p.dashY*380*dt);this.emit('trail',{x:p.x,y:p.y});}
      else if(len){dx/=len;dy/=len;if(!p.action)p.angle=Math.atan2(dy,dx);const speed=p.action?70:175;this.move(p,dx*speed*dt,dy*speed*dt);p.walk+=dt*10;}
      if(input.magic)this.cast();if(input.attack)this.attack();
      const companion=this.companion;companion.invulnerable=Math.max(0,companion.invulnerable-dt);companion.moving=false;
      if(companion.active||companion.joined){
        const d=distance(companion,p),tail=this.followPath[this.followPath.length-1];if(!tail||distance(tail,p)>18)this.followPath.push({x:p.x,y:p.y});
        while(this.followPath.length>1&&distance(companion,this.followPath[0])<15)this.followPath.shift();
        if(d>40&&(d<250||companion.joined)){const target=this.followPath[0]||p,a=Math.atan2(target.y-companion.y,target.x-companion.x),body={x:companion.x,y:companion.y,r:10},speed=d>145?190:150;this.move(body,Math.cos(a)*speed*dt,Math.sin(a)*speed*dt);companion.x=body.x;companion.y=body.y;companion.walk+=dt*8;companion.moving=true;
          if(companion.joined&&d>430){companion.x=p.x;companion.y=p.y+32;this.followPath=[];}}
        if(companion.active){for(const e of this.enemies)if(e.alive&&distance(e,companion)<e.r+19&&companion.invulnerable<=0){companion.hp=Math.max(0,companion.hp-10);companion.invulnerable=1.2;this.emit('float',{x:companion.x,y:companion.y-30,text:'护灯 −10',color:'#e9a18a'});}
          if(companion.hp<=0){companion.active=false;companion.failed=true;companion.x=1550;companion.y=1160;this.emit('escortFailed');this.emit('save');}
          else if(distance(companion,ESCORT_GOAL)<85&&distance(p,ESCORT_GOAL)<85){companion.active=false;companion.joined=true;this.completeMemory('escort');}
        }
      }
      for(const e of this.enemies) {
        if(!e.alive)continue;e.flash=Math.max(0,e.flash-dt);e.cooldown-=dt;
        if(e.type==='boss'&&this.quest<2)continue;
        const d=distance(e,p), aggro=e.type==='boss'?370:e.type==='wolf'?270:220;
        if(d>aggro&&e.windup<=0) {
          const home=distance(e,{x:e.homeX,y:e.homeY});if(home>8){const a=Math.atan2(e.homeY-e.y,e.homeX-e.x);this.move(e,Math.cos(a)*e.speed*.45*dt,Math.sin(a)*e.speed*.45*dt);}continue;
        }
        if(e.type==='boss'&&!this.bossStarted){this.bossStarted=true;this.emit('sound',{name:'boss'});if(!this.seen.has('guardian'))this.emit('scene',{id:'guardian'});this.emit('toast',{text:'荒根守卫 · 翻滚躲避根击，L 唤起同行共鸣',gold:true});}
        if(e.windup>0) {
          e.windup-=dt;
          if(e.windup<=0) {
            if(e.type==='boss') {
              if(e.phase%2===0) {
                this.effects.push({type:'impact',x:e.attackX,y:e.attackY,r:85,life:.5,maxLife:.5});
                if(distance(p,{x:e.attackX,y:e.attackY})<85+p.r)this.hurt(e.damage,e);
              } else for(let i=0;i<10;i++){const a=i*Math.PI/5+e.phase*.3;this.projectiles.push({x:e.x,y:e.y,vx:Math.cos(a)*145,vy:Math.sin(a)*145,r:7,life:2.8,hostile:true,damage:20});}
              e.phase++;if(e.hp<e.maxHp*.5){const a=Math.atan2(p.y-e.y,p.x-e.x);for(const o of [-.18,0,.18])this.projectiles.push({x:e.x,y:e.y,vx:Math.cos(a+o)*190,vy:Math.sin(a+o)*190,r:7,life:2.3,hostile:true,damage:17});}
            } else {
              if(e.type==='wolf'){const a=Math.atan2(e.attackY-e.y,e.attackX-e.x);this.move(e,Math.cos(a)*40,Math.sin(a)*40);}
              if(distance(e,p)<e.r+p.r+25)this.hurt(e.damage,e);
              this.effects.push({type:'impact',x:e.x,y:e.y,r:e.r+14,life:.23,maxLife:.23});
            }
            e.cooldown=e.type==='boss'?1.8:e.type==='wolf'?1.4:1.25;
          }
        } else if(e.cooldown<=0&&d<(e.type==='boss'?300:e.type==='wolf'?77:49)) {
          e.windup=e.type==='boss'?1.05:e.type==='wolf'?.5:.65;e.attackX=p.x;e.attackY=p.y;
        } else if(d>(e.type==='boss'?130:e.r+p.r+5)) {
          const a=Math.atan2(p.y-e.y,p.x-e.x);this.move(e,Math.cos(a)*e.speed*dt,Math.sin(a)*e.speed*dt);
        }
        if(this.dead)break;
      }
      for(const b of this.projectiles) {
        b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
        if(b.x<0||b.y<0||b.x>W||b.y>H)b.life=0;
        if(b.hostile) {if(distance(b,p)<b.r+p.r){this.hurt(b.damage,b);b.life=0;}}
        else {const e=this.enemies.find(e=>e.alive&&distance(e,b)<e.r+b.r&&(e.type!=='boss'||this.quest>=2));if(e){this.hitEnemy(e,b.damage,Math.atan2(b.vy,b.vx),7);b.life=0;}}
      }
      this.projectiles=this.projectiles.filter(b=>b.life>0);for(const fx of this.effects)fx.life-=dt;this.effects=this.effects.filter(f=>f.life>0);
    }
    serialize() {
      const p=this.player;return {version:SAVE_VERSION,quest:this.quest,opened:[...this.opened],killed:[...this.killed],memories:[...this.memories],seen:[...this.seen],talents:{...this.talents},mirrors:[...this.mirrors],promise:this.promise,companion:{...this.companion},elapsed:Math.round(this.elapsed),kills:this.kills,
        player:{x:p.x,y:p.y,hp:p.hp,mp:p.mp,level:p.level,xp:p.xp,coins:p.coins,potions:p.potions}};
    }
    static fromSave(data) {
      if(!data||data.version!==SAVE_VERSION||!data.player||!Array.isArray(data.opened)||!Array.isArray(data.killed))return null;
      const g=new Game(),p=data.player;
      for(const k of ['x','y','hp','mp','level','xp','coins','potions'])if(typeof p[k]!=='number'||!Number.isFinite(p[k]))return null;
      if(!Number.isInteger(data.quest)||data.quest<0||data.quest>4)return null;
      g.opened=new Set(data.opened.filter(id=>CHESTS.some(c=>c.id===id)));
      if(!Array.isArray(data.memories)||!Array.isArray(data.seen))return null;
      g.memories=new Set(data.memories.filter(id=>MEMORY_ORDER.includes(id)));g.stones=g.memories.size;
      if([...g.memories].some(id=>MEMORY_ORDER.slice(0,MEMORY_ORDER.indexOf(id)).some(prev=>!g.memories.has(prev))))return null;
      g.seen=new Set(data.seen.filter(id=>typeof id==='string'));g.promise=data.promise==='home'?'home':'sea';
      if(Array.isArray(data.mirrors)&&data.mirrors.length===3)g.mirrors=data.mirrors.map(n=>Number.isInteger(n)?clamp(n,0,3):0);
      g.quest=data.quest;
      if(g.quest===0&&g.memories.size>0)return null;
      if(g.quest>=2&&g.stones<3)return null;
      g.killed=new Set(data.killed.filter(id=>ENEMY_SEEDS.some(e=>e[0]===id)));
      if(g.quest>=3&&!g.killed.has('boss'))return null;
      if(g.quest<3&&g.killed.has('boss'))return null;
      g.enemies.forEach(e=>{if(g.killed.has(e.id)){e.alive=false;e.hp=0;}});
      g.kills=g.killed.size;g.elapsed=typeof data.elapsed==='number'&&Number.isFinite(data.elapsed)?clamp(data.elapsed,0,1e7):0;
      const t=g.player;t.level=clamp(Math.floor(p.level),1,30);
      let points=t.level-1;for(const id of Object.keys(TALENTS)){const n=data.talents?.[id];g.talents[id]=Number.isInteger(n)?clamp(n,0,Math.min(3,points)):0;points-=g.talents[id];}
      t.maxHp=100+(t.level-1)*14+g.talents.heart*20;t.maxMp=60+(t.level-1)*6;
      t.hp=clamp(p.hp,1,t.maxHp);t.mp=clamp(p.mp,0,t.maxMp);t.xp=clamp(p.xp,0,g.xpNeeded-1);
      t.coins=clamp(Math.floor(p.coins),0,99999);t.potions=clamp(Math.floor(p.potions),0,999);t.sword=g.quest>=2;
      t.x=clamp(p.x,60,W-60);t.y=clamp(p.y,70,H-60);
      if(solidAt(t.x,t.y,t.r,g.quest)){t.x=610;t.y=1340;}
      if(g.memories.has('escort')){Object.assign(g.companion,{joined:true,x:t.x+25,y:t.y+25});}
      else if(data.companion?.active&&g.memories.has('music')){Object.assign(g.companion,{active:true,x:t.x,y:t.y+30,hp:clamp(Number(data.companion.hp)||100,1,100),invulnerable:2});}
      t.invulnerable=1.5;return g;
    }
  }
  const API={Game,W,H,NPCS,CHESTS,STORY_SITES,ESCORT_GOAL,TALENTS,BEACON,FIRE,HOUSE_RECTS,SCENERY,ENEMY_SEEDS,clamp,distance,seeded,nearPath,inWater,solidAt};
  if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.MosslightCore=API;
})(typeof globalThis!=='undefined'?globalThis:this);
