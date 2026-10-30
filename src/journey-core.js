(function(root){
  'use strict';
  const D=typeof module!=='undefined'&&module.exports?require('./journey-data.js'):root.MosslightJourneyData;
  const geometry=typeof module!=='undefined'&&module.exports?require('./journey-render.js'):null;
  const W=2200,H=1600,VERSION=1,TALENT_CAP=10,CAMP={x:220,y:1300},BATTLE_TYPES=new Set(['battle','defend','boss']);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const finite=v=>typeof v==='number'&&Number.isFinite(v),copy=v=>JSON.parse(JSON.stringify(v));
  const ITEM_IDS=['wood','herb','grain','mushroom','ore','seed','stew','tea','roast','trap'];
  const WEAPON_DEFAULTS={sword:{range:72,arc:1.3,damage:24,speed:.46,stamina:12},spear:{range:115,arc:.45,damage:29,speed:.65,stamina:15},axe:{range:77,arc:1.6,damage:44,speed:.9,stamina:24}};
  const ENEMY={
    wolf:{name:'荆棘猎犬',hp:90,speed:112,r:17,damage:15,xp:18,range:155,delay:.68},
    spitter:{name:'腐叶吐蛛',hp:75,speed:62,r:18,damage:14,xp:20,range:330,delay:.9},
    shell:{name:'石甲守卫',hp:160,speed:49,r:23,damage:23,xp:26,range:90,delay:1.15},
    burrow:{name:'潜根兽',hp:110,speed:78,r:20,damage:21,xp:24,range:260,delay:1.2},
    wisp:{name:'迷途灯影',hp:65,speed:95,r:14,damage:13,xp:23,range:300,delay:.85},
    boss:{name:'回声守卫',hp:580,speed:48,r:42,damage:26,xp:150,range:360,delay:1.15}
  };
  const DEFAULT_RECIPES={stew:{cost:{grain:2,mushroom:1}},tea:{cost:{herb:2}},roast:{cost:{mushroom:2,wood:1}},trap:{cost:{wood:2,ore:1}}};
  const DEFAULT_BUILDINGS={kitchen:{cost:{wood:6,ore:2}},workshop:{cost:{wood:8,ore:4}},house:{cost:{wood:10,ore:3}},garden:{cost:{wood:4,seed:2}}};
  function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function normalizeType(t){return ENEMY[t]?t:'wolf';}
  function allNodes(){return D.CHAPTERS.flatMap(c=>c.nodes).concat(D.SIDEQUESTS.flatMap(q=>q.nodes));}
  class Campaign{
    constructor(){
      this.player={x:CAMP.x,y:CAMP.y,r:12,hp:110,maxHp:110,mp:70,maxMp:70,stamina:100,maxStamina:100,level:1,xp:0,weapon:'sword',angle:-Math.PI/2,moving:false,walk:0,action:null,dashTime:0,invulnerable:0,potions:4,coins:18,attackCooldown:0,spellCooldown:0,dashCooldown:0,staminaDelay:0,guard:false,guardAge:1,guardCooldown:0,combo:0,comboWindow:0,resonanceCooldown:0,dashX:0,dashY:0,buffs:{warm:0,food:0,power:0}};
      this.chapter=0;this.unlocked=0;this.progress=D.CHAPTERS.map(()=>0);this.sideProgress=Object.fromEntries(D.SIDEQUESTS.map(q=>[q.id,0]));
      this.completed=new Set();this.started=new Set();this.battleReady=new Set();this.rewardedKills=new Set();this.choices={};this.flags=new Set();
      this.inventory=Object.fromEntries(ITEM_IDS.map(id=>[id,0]));Object.assign(this.inventory,{wood:8,herb:5,grain:4,mushroom:3,ore:3,seed:6,trap:2});
      this.buildings=new Set();this.garden=Array.from({length:6},()=>({planted:false,growth:0,crop:'grain'}));
      this.talents={blade:0,fire:0,heart:0};this.bond=0;this.trust=0;this.spell='fire';
      this.elapsed=0;this.dead=false;this.finished=false;this.events=[];this.combat=null;this.enemies=[];this.projectiles=[];this.effects=[];this.traps=[];this.resources=[];this.regionStates={};this.noticeCooldown=0;
      this.companion={x:CAMP.x+35,y:CAMP.y+15,walk:0,moving:false,cooldown:4};this.stats={battles:0,parries:0,crafted:0,deaths:0,kills:0,gathered:0,readSeconds:0};
      this.loadRegion(0);
    }
    emit(type,detail={}){this.events.push({type,...detail});}
    notice(text){if(this.noticeCooldown<=0){this.emit('toast',{text});this.noticeCooldown=.8;}return false;}
    get weather(){return D.CHAPTERS[this.chapter].weather||'clear';}
    get xpNeeded(){return 65+this.player.level*28;}
    get skillPoints(){return Math.max(0,this.player.level-1-Object.values(this.talents).reduce((a,b)=>a+b,0));}
    get nearCamp(){return dist(this.player,CAMP)<150&&!this.combat;}
    get guarding(){return this.player.guard;}
    get damage(){const w=this.weaponStats();return w.damage+(this.player.level-1)*3+this.talents.blade*5+(this.buildings.has('workshop')?5:0)+(this.player.buffs.power>0?9:0);}
    weaponStats(){return {...WEAPON_DEFAULTS[this.player.weapon],...(D.WEAPONS?.[this.player.weapon]||{})};}
    getNode(id){return allNodes().find(n=>n.id===id)||null;}
    activeNode(){return D.CHAPTERS[this.chapter].nodes[this.progress[this.chapter]]||null;}
    visibleNodes(){return D.CHAPTERS[this.chapter].nodes.filter((n,i)=>i<=this.progress[this.chapter]).concat(D.SIDEQUESTS.filter(q=>q.chapter===this.chapter).flatMap(q=>q.nodes[this.sideProgress[q.id]]?[{...q.nodes[this.sideProgress[q.id]],sideQuest:q.id}]:[]));}
    eligibleNode(id){const main=this.activeNode();return main?.id===id||D.SIDEQUESTS.some(q=>q.chapter===this.chapter&&q.nodes[this.sideProgress[q.id]]?.id===id);}
    eligibleAnywhere(id){const loc=this.locateNode(id);return !!loc&&loc.chapter<=this.unlocked&&(loc.side?this.sideProgress[loc.side]===loc.index:this.progress[loc.chapter]===loc.index);}
    locateNode(id){for(let i=0;i<D.CHAPTERS.length;i++){const index=D.CHAPTERS[i].nodes.findIndex(n=>n.id===id);if(index>=0)return{chapter:i,index};}for(const q of D.SIDEQUESTS){const index=q.nodes.findIndex(n=>n.id===id);if(index>=0)return{chapter:q.chapter,index,side:q.id};}return null;}
    solidAt(x,y,r=12,chapter=this.chapter){return x-r<40||x+r>W-40||y-r<45||y+r>H-40||!!(geometry||root.MosslightJourneyRenderer)?.solidAt(chapter,x,y,r,this.buildings);}
    freePosition(x,y,r=12,chapter=this.chapter){x=clamp(x,40+r,W-40-r);y=clamp(y,45+r,H-40-r);if(!this.solidAt(x,y,r,chapter))return{x,y};for(let radius=16;radius<=256;radius+=16)for(let i=0;i<16;i++){const a=i*Math.PI/8,nx=x+Math.cos(a)*radius,ny=y+Math.sin(a)*radius;if(!this.solidAt(nx,ny,r,chapter))return{x:nx,y:ny};}return{x:CAMP.x,y:CAMP.y};}
    makeEnemy(type,id,x,y,battleId=null){
      type=normalizeType(type);const s=ENEMY[type],chapter=this.chapter,factor=1+chapter*.2;
      const safe=this.freePosition(x,y,s.r);x=safe.x;y=safe.y;
      const bossNode=type==='boss'&&battleId?this.getNode(battleId):null;
      return{id,type,name:bossNode?.bossName||bossNode?.title||s.name,x,y,homeX:x,homeY:y,r:s.r,hp:Math.round(s.hp*factor),maxHp:Math.round(s.hp*factor),speed:s.speed,damage:Math.round(s.damage*(1+chapter*.09)),xp:s.xp+chapter*2,windup:0,windupMax:s.delay,attackX:x,attackY:y,alive:true,flash:0,phase:0,angle:0,cooldown:1.3,burn:0,frost:0,stunned:0,burnTick:0,underground:false,battleId,attackKind:'melee'};
    }
    createRegion(index){
      const random=seeded(1087+index*1999),resources=[],enemies=[];
      const types=['wood','herb','grain','mushroom','ore','seed'];
      for(let i=0;i<24;i++){const x=i<6?300+i*65:350+random()*1650,y=i<6?1450:160+random()*1300,safe=this.freePosition(x,y,14,index);resources.push({id:'r'+index+'_'+i,x:Math.round(safe.x),y:Math.round(safe.y),kind:types[i%types.length],amount:3+(i%2),harvested:false});}
      const points=[[950,1300],[1150,760],[1550,650],[1820,1040],[1100,300],[650,500],[2020,500],[1650,1450]];
      const order=['wolf','spitter','shell','burrow','wisp'];for(let i=0;i<points.length;i++){const [x,y]=points[i];enemies.push(this.makeEnemy(order[(i+index)%order.length],'wild'+index+'_'+i,x,y));}
      return{resources,enemies};
    }
    storeRegion(){this.regionStates[this.chapter]={resources:copy(this.resources),enemies:copy(this.enemies.filter(e=>!e.battleId))};}
    loadRegion(index){this.chapter=index;const saved=this.regionStates[index]||this.createRegion(index);this.resources=copy(saved.resources);this.enemies=copy(saved.enemies);this.projectiles=[];this.effects=[];this.traps=[];this.combat=null;}
    nearestEnemy(range){return this.enemies.filter(e=>e.alive&&!e.underground&&dist(e,this.player)<range).sort((a,b)=>dist(a,this.player)-dist(b,this.player))[0]||null;}
    move(entity,dx,dy){const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/7)),r=entity.r||12;for(let i=0;i<steps;i++){if(!this.solidAt(entity.x+dx/steps,entity.y,r))entity.x+=dx/steps;if(!this.solidAt(entity.x,entity.y+dy/steps,r))entity.y+=dy/steps;}}
    spendStamina(amount){const p=this.player;if(p.stamina<amount)return this.notice('体力不足，松开格挡、拉开距离恢复');p.stamina-=amount;p.staminaDelay=.7;return true;}
    attack(){
      const p=this.player,w=this.weaponStats();if(this.dead||p.action||p.dashTime>0||p.attackCooldown>0||p.guard)return false;
      if(!this.spendStamina(w.stamina))return false;const target=this.nearestEnemy(w.range+30);if(target)p.angle=Math.atan2(target.y-p.y,target.x-p.x);
      p.combo=p.comboWindow>0?p.combo%3+1:1;p.comboWindow=1.65;const heavy=p.weapon==='sword'&&p.combo===3,duration=w.speed*(heavy?1.3:1);
      p.action={type:'attack',time:0,duration,hitAt:duration*.36,hit:false,angle:p.angle,combo:p.combo,weapon:p.weapon};p.attackCooldown=duration;
      this.emit('sound',{name:'select'});return true;
    }
    strike(a){
      const p=this.player,w={...WEAPON_DEFAULTS[a.weapon],...(D.WEAPONS?.[a.weapon]||{})},power=a.weapon==='sword'&&a.combo===3?1.5:1;
      this.effects.push({type:'slash',x:p.x,y:p.y,angle:a.angle,r:w.range,weapon:a.weapon,life:.28,maxLife:.28});this.emit('sound',{name:'slash'});
      for(const e of this.enemies){if(!e.alive||e.underground)continue;const angle=Math.atan2(e.y-p.y,e.x-p.x),delta=Math.atan2(Math.sin(angle-a.angle),Math.cos(angle-a.angle));if(dist(e,p)<w.range+e.r&&Math.abs(delta)<w.arc){this.hitEnemy(e,Math.round(this.damage*power),{weapon:a.weapon,stagger:a.weapon==='axe'?.6:.12});this.move(e,Math.cos(angle)*(a.weapon==='axe'?22:8),Math.sin(angle)*(a.weapon==='axe'?22:8));}}
    }
    cast(){
      const p=this.player;if(this.dead||p.action||p.dashTime>0||p.guard||p.spellCooldown>0)return false;if(p.mp<18)return this.notice('魔力不足，稍作周旋后再施法');if(!this.spendStamina(8))return false;
      const target=this.nearestEnemy(480);if(target)p.angle=Math.atan2(target.y-p.y,target.x-p.x);p.mp-=18;p.spellCooldown=.95;p.action={type:'cast',time:0,duration:.65,hitAt:.34,hit:false,angle:p.angle,spell:this.spell};return true;
    }
    releaseSpell(a){const p=this.player,damage=30+p.level*4+this.talents.fire*10;
      if(a.spell==='lightning'){const target=this.nearestEnemy(380);const radius=this.weather==='rain'?185:115;if(target){const candidates=this.enemies.filter(e=>e.alive&&dist(e,target)<radius);for(const e of candidates)this.hitEnemy(e,damage,{element:'lightning',stagger:.35});this.effects.push({type:'lightning',x:target.x,y:target.y,r:radius,life:.45,maxLife:.45});}else this.effects.push({type:'lightning',x:p.x+Math.cos(a.angle)*130,y:p.y+Math.sin(a.angle)*130,r:70,life:.4,maxLife:.4});}
      else for(const offset of this.talents.fire>=2?[-.07,.07]:[0]){const angle=a.angle+offset;this.projectiles.push({x:p.x+Math.cos(angle)*25,y:p.y+Math.sin(angle)*25,vx:Math.cos(angle)*410,vy:Math.sin(angle)*410,r:7,life:1.3,hostile:false,damage,element:a.spell});}this.emit('sound',{name:'magic'});
    }
    dash(dx=0,dy=0){const p=this.player;if(this.dead||p.dashCooldown>0||p.dashTime>0)return false;if(!this.spendStamina(25))return false;const length=Math.hypot(dx,dy);p.dashX=length?dx/length:Math.cos(p.angle);p.dashY=length?dy/length:Math.sin(p.angle);p.action=null;p.guard=false;p.dashTime=.32;p.invulnerable=.34;p.dashCooldown=.85;this.emit('sound',{name:'dash'});return true;}
    block(active){const p=this.player;if(this.dead){p.guard=false;return false;}if(!active){if(p.guard)p.guardCooldown=.38;p.guard=false;return true;}if(p.action||p.dashTime>0||p.stamina<3)return false;if(!p.guard){p.guardAge=p.guardCooldown>0?1:0;p.guard=true;}return true;}
    cycleWeapon(){if(this.player.action||this.player.dashTime>0)return false;const ids=['sword','spear','axe'];this.player.weapon=ids[(ids.indexOf(this.player.weapon)+1)%ids.length];this.emit('toast',{text:'装备 '+(D.WEAPONS?.[this.player.weapon]?.name||this.player.weapon)});this.emit('save');return true;}
    cycleSpell(){if(this.player.action)return false;const ids=['fire','frost','lightning'];this.spell=ids[(ids.indexOf(this.spell)+1)%ids.length];this.emit('toast',{text:'法术切换：'+({fire:'焰火 · 持续灼烧',frost:'霜息 · 减速与破甲',lightning:'惊雷 · 雨中连锁'}[this.spell])});this.emit('save');return true;}
    hitEnemy(e,damage,opts={}){
      if(!e||!e.alive||!finite(damage)||damage<=0)return false;if(e.underground&&!opts.element&&!opts.trap)return false;
      let actual=damage;if(e.type==='shell'&&e.frost<=0&&opts.weapon!=='axe'&&opts.element!=='lightning'&&!opts.trap)actual*=.38;
      if(opts.element==='fire'){e.burn=this.weather==='rain'?2:5;actual*=this.weather==='rain'?.75:1;}
      if(opts.element==='frost'){e.frost=5;e.stunned=Math.max(e.stunned,.25);}
      if(opts.stagger)e.stunned=Math.max(e.stunned,opts.stagger);if(opts.trap){e.stunned=2.5;e.underground=false;}
      actual=Math.max(1,Math.round(actual));e.hp=Math.max(0,e.hp-actual);e.flash=.18;
      this.emit('float',{x:e.x,y:e.y-35,text:String(actual),color:opts.element==='frost'?'#acd9e1':'#f1d6ac'});this.emit('burst',{x:e.x,y:e.y,color:'#d6c69e',count:5});
      if(e.hp<=0){e.alive=false;e.windup=0;e.underground=false;if(!this.rewardedKills.has(e.id)){this.rewardedKills.add(e.id);this.stats.kills++;this.player.coins+=e.type==='boss'?35:5;this.addXP(e.xp);this.growGarden(.12);if(this.stats.kills%4===0)this.inventory.herb++;if(e.type==='shell')this.inventory.ore++;}this.emit('sound',{name:'kill'});this.emit('save');}
      return true;
    }
    hurt(amount,source){
      const p=this.player;if(this.dead||p.invulnerable>0)return false;
      const angle=source?Math.atan2(source.y-p.y,source.x-p.x):p.angle,delta=Math.atan2(Math.sin(angle-p.angle),Math.cos(angle-p.angle));
      if(p.guard&&Math.abs(delta)<1.4&&p.stamina>=12){p.stamina-=12;p.staminaDelay=1;
        if(p.guardAge<.2){this.stats.parries++;p.stamina=Math.min(p.maxStamina,p.stamina+7);p.mp=Math.min(p.maxMp,p.mp+6);if(source&&'stunned'in source){source.stunned=1.3;source.windup=0;source.underground=false;}this.emit('float',{x:p.x,y:p.y-50,text:'精准格挡',color:'#b5e6c9'});this.emit('sound',{name:'interact'});p.invulnerable=.2;return false;}
        amount*=.25;this.emit('float',{x:p.x,y:p.y-45,text:'格挡',color:'#b5d5c4'});
      }else if(p.guard){p.guard=false;p.stamina=0;this.emit('toast',{text:'防御失衡，翻滚前先恢复体力'});}
      if(this.flags.has('hold_line'))amount*=.9;if(this.player.buffs.food>0)amount*=.9;amount=Math.ceil(amount);
      p.hp=Math.max(0,p.hp-amount);p.invulnerable=.65;p.action={type:'hurt',time:0,duration:.22,hit:true,angle:p.angle};this.emit('sound',{name:'hurt'});this.emit('float',{x:p.x,y:p.y-38,text:'−'+amount,color:'#ee9e83'});
      if(!p.hp){this.dead=true;p.guard=false;this.stats.deaths++;this.emit('death');}return true;
    }
    addXP(amount){if(!finite(amount)||amount<=0)return;const p=this.player;p.xp+=Math.floor(amount);while(p.level<30&&p.xp>=this.xpNeeded){p.xp-=this.xpNeeded;p.level++;this.recalculate();p.hp=p.maxHp;p.mp=p.maxMp;p.stamina=p.maxStamina;this.emit('levelup');this.emit('toast',{text:'Lv.'+p.level+' · 获得一点成长天赋'});this.emit('sound',{name:'levelup'});}if(p.level===30)p.xp=Math.min(p.xp,this.xpNeeded-1);}
    recalculate(){const p=this.player;p.maxHp=110+(p.level-1)*9+this.talents.heart*18+(this.buildings.has('house')?20:0);p.maxMp=70+(p.level-1)*3;p.maxStamina=100+(this.buildings.has('workshop')?15:0);p.hp=Math.min(p.hp,p.maxHp);p.mp=Math.min(p.mp,p.maxMp);p.stamina=Math.min(p.stamina,p.maxStamina);}
    learnTalent(id){if(!Object.hasOwn(this.talents,id)||this.skillPoints<1||this.talents[id]>=TALENT_CAP)return false;this.talents[id]++;const hp=this.player.hp;this.recalculate();if(id==='heart')this.player.hp=Math.min(this.player.maxHp,hp+18);this.emit('sound',{name:'levelup'});this.emit('save');return true;}
    useItem(id){const p=this.player;if(this.dead)return false;
      if(id==='potion'){if(!p.potions)return this.notice('药水用完了，可在营地用草药制作');if(p.hp>=p.maxHp)return this.notice('生命已满');p.potions--;p.hp=Math.min(p.maxHp,p.hp+65);}
      else{if(!ITEM_IDS.includes(id)||!this.inventory[id])return this.notice('行囊里没有这种物品');if(!['stew','tea','roast'].includes(id))return false;this.inventory[id]--;if(id==='stew'){p.hp=Math.min(p.maxHp,p.hp+75);p.buffs.food=180;}if(id==='tea'){p.mp=Math.min(p.maxMp,p.mp+55);p.stamina=Math.min(p.maxStamina,p.stamina+40);p.buffs.warm=240;}if(id==='roast'){p.stamina=p.maxStamina;p.buffs.power=180;}}
      this.emit('sound',{name:'potion'});this.emit('save');return true;
    }
    placeTrap(){if(this.dead||!this.inventory.trap)return this.notice('需要木材与矿石制作的绊索陷阱');if(this.traps.length>=5)return this.notice('最多同时布置五个陷阱');const p=this.player;this.inventory.trap--;this.traps.push({x:clamp(p.x+Math.cos(p.angle)*35,45,W-45),y:clamp(p.y+Math.sin(p.angle)*35,55,H-45),life:180,r:35});this.emit('sound',{name:'interact'});this.emit('save');return true;}
    resonance(){const p=this.player;if(this.dead||this.chapter<2&&this.bond<1||p.resonanceCooldown>0)return false;p.resonanceCooldown=Math.max(12,24-this.bond*.8);const heal=28+this.talents.heart*11+this.bond*2;p.hp=Math.min(p.maxHp,p.hp+heal);for(const e of this.enemies)if(e.alive&&dist(e,p)<170)this.hitEnemy(e,28+this.bond*4,{element:'lightning',stagger:.8});this.effects.push({type:'resonance',x:p.x,y:p.y,r:170,life:.7,maxLife:.7});this.emit('float',{x:p.x,y:p.y-50,text:'同行 +'+heal,color:'#ecc8b0'});this.emit('sound',{name:'levelup'});return true;}
    nodeDistance(node){return dist(this.player,node);}
    interact(){if(this.dead)return null;const node=this.visibleNodes().filter(n=>dist(this.player,n)<85).sort((a,b)=>Number(this.completed.has(a.id))-Number(this.completed.has(b.id))||dist(a,this.player)-dist(b,this.player))[0];if(node)return{kind:'node',node};if(dist(this.player,CAMP)<150)return{kind:'camp'};
      const resource=this.resources.filter(r=>!r.harvested&&dist(this.player,r)<65).sort((a,b)=>dist(a,this.player)-dist(b,this.player))[0];if(resource){resource.harvested=true;this.inventory[resource.kind]+=resource.amount;this.stats.gathered+=resource.amount;this.emit('toast',{text:(D.ITEMS?.[resource.kind]?.name||resource.kind)+' +'+resource.amount});this.emit('sound',{name:'interact'});this.emit('save');return{kind:'resource',resource};}return null;
    }
    beginNode(id){if(this.dead||this.completed.has(id)||!this.eligibleNode(id))return false;const node=this.getNode(id);if(dist(this.player,node)>110)return this.notice('先走到故事地点附近');if(this.combat&&this.combat.nodeId!==id)return this.notice('先完成正在进行的战斗');this.started.add(id);
      if(BATTLE_TYPES.has(node.type)&&!this.battleReady.has(id)&&!this.combat){const waves=clamp(Math.floor(node.waves||1),1,4);this.combat={nodeId:id,wave:1,total:waves};if(node.type==='defend')Object.assign(this.combat,{integrity:100,x:node.x,y:node.y});this.spawnWave();this.emit('toast',{text:node.title+' · 第 1 / '+waves+' 波'});if(node.type==='defend'&&this.flags.has('hold_line'))this.emit('toast',{text:'坚守防线 · 灯火受到的伤害降低 45%，敌人数量保持不变'});}this.emit('save');return true;
    }
    spawnWave(){const node=this.getNode(this.combat.nodeId),wave=this.combat.wave;let types=node.enemies?.length?[...node.enemies]:node.type==='boss'?['boss','wisp']:['wolf','spitter','shell'];if(node.type==='boss'&&!types.includes('boss'))types.push('boss');if(this.flags.has('share_burden')&&types.length>2){const helper=types.findIndex(t=>t!=='boss');if(helper>=0)types.splice(helper,1);}
      this.enemies=this.enemies.filter(e=>e.battleId!==node.id);types.slice(0,10).forEach((type,i)=>{const a=i*Math.PI*2/types.length+.3,r=145+(i%2)*45,enemy=this.makeEnemy(type,node.id+'_w'+wave+'_'+i,clamp(node.x+Math.cos(a)*r,60,W-60),clamp(node.y+Math.sin(a)*r,60,H-60),node.id);if(type==='boss')enemy.name=node.bossName||node.title;this.enemies.push(enemy);});
    }
    advanceBattle(){if(!this.combat||this.enemies.some(e=>e.alive&&e.battleId===this.combat.nodeId))return;const b=this.combat;
      if(b.wave<b.total){b.wave++;this.player.stamina=Math.min(this.player.maxStamina,this.player.stamina+25);this.spawnWave();this.emit('toast',{text:'保持阵形 · 第 '+b.wave+' / '+b.total+' 波'});this.emit('save');}
      else{this.battleReady.add(b.nodeId);this.stats.battles++;this.combat=null;this.projectiles=this.projectiles.filter(p=>!p.hostile);this.emit('battleCleared',{nodeId:b.nodeId});this.emit('save');}
    }
    resolveNode(id,{choice,answer}={}){
      if(this.dead)return{ok:false,message:'先回到营地恢复'};if(this.completed.has(id))return{ok:false,message:'这一段故事已经完成'};if(!this.eligibleNode(id))return{ok:false,message:'先完成前面的线索'};const n=this.getNode(id);
      if(!this.started.has(id))return{ok:false,message:'先与故事地点交互'};
      if(BATTLE_TYPES.has(n.type)&&!this.battleReady.has(id))return{ok:false,message:'危险尚未解除'};
      if(n.puzzle&&(!Array.isArray(answer)||answer.length!==n.puzzle.solution.length||answer.some((v,i)=>v!==n.puzzle.solution[i])))return{ok:false,message:'线索还没有连起来，再看一看提示'};
      let selected=null;if(n.choices?.length){selected=n.choices.find(c=>c.id===choice);if(!selected)return{ok:false,message:'请选择要说的话'};}
      if(selected){this.choices[id]=choice;const effect=selected.effect||{};this.bond=clamp(this.bond+(effect.bond||0),0,50);this.trust=clamp(this.trust+(effect.trust||0),0,50);if(effect.flag)this.flags.add(effect.flag);}
      this.completed.add(id);this.battleReady.delete(id);const loc=this.locateNode(id);if(loc.side)this.sideProgress[loc.side]++;else this.progress[loc.chapter]++;
      const reward=n.reward||{};this.addXP(reward.xp||55);for(const [item,amount]of Object.entries(reward.items||{}))if(ITEM_IDS.includes(item)&&finite(amount))this.inventory[item]+=Math.max(0,Math.floor(amount));this.player.coins+=8;this.growGarden(1);
      if(loc.side&&this.sideProgress[loc.side]===D.SIDEQUESTS.find(q=>q.id===loc.side).nodes.length){this.player.potions++;this.emit('toast',{text:'支线完成 · 获得旅途补给'});}
      if(!loc.side&&this.progress[loc.chapter]===D.CHAPTERS[loc.chapter].nodes.length){this.unlocked=Math.max(this.unlocked,Math.min(D.CHAPTERS.length-1,loc.chapter+1));this.emit('chapterComplete',{chapter:loc.chapter});if(loc.chapter===D.CHAPTERS.length-1){this.finished=true;this.emit('win');}}
      this.emit('sound',{name:'interact'});this.emit('save');return{ok:true,message:'新的回忆已写入手札'};
    }
    travel(index){if(!Number.isInteger(index)||index<0||index>this.unlocked||index>=D.CHAPTERS.length||this.dead)return false;if(this.combat)return this.notice('先结束当前战斗，再启程');if(index===this.chapter)return false;this.storeRegion();const first=!this.regionStates[index];this.loadRegion(index);Object.assign(this.player,{x:CAMP.x,y:CAMP.y,action:null,guard:false,dashTime:0,invulnerable:2});Object.assign(this.companion,{x:CAMP.x+35,y:CAMP.y+20});if(first&&this.trust>=2){this.inventory.herb+=Math.min(6,this.trust);this.player.potions++;this.emit('toast',{text:'村民寄来药草与药水 · 你们的信任有了回响'});}this.emit('save');return true;}
    canPay(cost){return Object.entries(cost||{}).every(([k,v])=>ITEM_IDS.includes(k)&&finite(v)&&v>=0&&this.inventory[k]>=v);}
    pay(cost){for(const [k,v]of Object.entries(cost||{}))this.inventory[k]-=v;}
    craft(id){if(!this.nearCamp)return this.notice('回到营火旁再动手制作');if(id==='potion'){if(this.inventory.herb<3)return this.notice('制作药水需要 3 份药草');this.inventory.herb-=3;this.player.potions++;}
      else{const recipe=D.RECIPES?.[id]||DEFAULT_RECIPES[id];if(!recipe||!Object.hasOwn(DEFAULT_RECIPES,id))return false;if(!this.canPay(recipe.cost))return this.notice('材料不足，营地周围可以采集');this.pay(recipe.cost);this.inventory[id]+=this.buildings.has('kitchen')&&id!=='trap'?2:1;}this.stats.crafted++;this.emit('sound',{name:'interact'});this.emit('save');return true;
    }
    build(id){if(!this.nearCamp)return this.notice('回到营地再进行修建');const b=D.BUILDINGS?.[id]||DEFAULT_BUILDINGS[id];if(!b||!Object.hasOwn(DEFAULT_BUILDINGS,id)||this.buildings.has(id))return false;if(!this.canPay(b.cost))return this.notice('修建材料还不够');this.pay(b.cost);this.buildings.add(id);this.recalculate();this.emit('toast',{text:(b.name||id)+'修建完成'});this.emit('sound',{name:'levelup'});this.emit('save');return true;}
    plant(index){if(!this.nearCamp)return false;if(!Number.isInteger(index)||index<0||index>=(this.buildings.has('garden')?6:3)||this.garden[index].planted||this.inventory.seed<1)return false;this.inventory.seed--;this.garden[index]={planted:true,growth:0,crop:['grain','herb','mushroom'][index%3]};this.emit('save');return true;}
    growGarden(amount){for(const plot of this.garden)if(plot.planted)plot.growth=Math.min(2,plot.growth+amount);}
    harvest(index){if(!this.nearCamp||!Number.isInteger(index))return false;const plot=this.garden[index];if(!plot?.planted||plot.growth<2)return false;this.inventory[plot.crop]+=3;this.inventory.seed++;this.garden[index]={planted:false,growth:0,crop:plot.crop};this.emit('sound',{name:'interact'});this.emit('save');return true;}
    rest(){if(!this.nearCamp||this.dead)return this.notice('先回到营地，摆脱追逐再休息');const p=this.player;p.hp=p.maxHp;p.mp=p.maxMp;p.stamina=p.maxStamina;p.action=null;p.guard=false;this.growGarden(1);for(let i=0;i<this.resources.length;i++)if(i<6||this.resources[i].kind==='herb')this.resources[i].harvested=false;this.emit('toast',{text:'围炉休息 · 生命、魔力与体力恢复，菜圃长大了一些'});this.emit('save');return true;}
    revive(){if(!this.dead)return false;const p=this.player;this.dead=false;p.coins=Math.floor(p.coins*.9);p.hp=p.maxHp;p.mp=p.maxMp;p.stamina=p.maxStamina;p.x=CAMP.x;p.y=CAMP.y;p.action=null;p.guard=false;p.invulnerable=3;p.dashTime=0;this.projectiles=[];this.traps=[];if(this.combat){const id=this.combat.nodeId;this.enemies=this.enemies.filter(e=>e.battleId!==id);this.combat=null;}this.companion.x=p.x+35;this.companion.y=p.y+20;this.emit('save');return true;}
    enemyTarget(e){return this.combat?.integrity!==undefined&&e.battleId===this.combat.nodeId&&dist(e,this.player)>105?this.combat:this.player;}
    damageDefense(amount){if(this.combat?.integrity===undefined)return;const b=this.combat,p=this.player;if(this.flags.has('hold_line'))amount*=.55;if(p.guard&&p.stamina>=6&&dist(p,b)<75){amount*=.25;p.stamina-=6;p.staminaDelay=.6;this.emit('float',{x:p.x,y:p.y-54,text:'护住灯火',color:'#b5dac3'});}b.integrity=Math.max(0,b.integrity-amount);this.emit('float',{x:b.x,y:b.y-48,text:'灯火 −'+Math.ceil(amount),color:'#eeaa85'});if(b.integrity<=0){const id=b.nodeId;for(const e of this.enemies)if(e.battleId===id)e.alive=false;this.combat=null;this.projectiles=this.projectiles.filter(p=>!p.hostile);this.emit('toast',{text:'灯火熄灭了，但故事不会止步。回到标记处可以重新守护。'});this.emit('battleFailed',{nodeId:id});this.emit('save');}}
    enemyTelegraph(e){
      const p=this.enemyTarget(e),s=ENEMY[e.type];e.windup=s.delay;e.windupMax=s.delay;e.attackX=p.x;e.attackY=p.y;e.angle=Math.atan2(p.y-e.y,p.x-e.x);
      const bossPattern=[['slam','fan','charge'],['burrow','fan','slam'],['fan','charge','slam'],['slam','charge','fan']][this.chapter%4];
      e.attackKind=e.type==='wolf'?'charge':e.type==='spitter'?'spit':e.type==='shell'?'slam':e.type==='burrow'?'burrow':e.type==='wisp'?'fan':bossPattern[e.phase%3];
      if(e.attackKind==='burrow'){e.underground=true;e.windup=1.2;e.windupMax=1.2;}
      if(e.type==='boss'&&e.hp<e.maxHp*.5)e.windup*=.8;
    }
    enemyStrike(e){
      const p=this.player,kind=e.attackKind;e.underground=false;
      if(kind==='spit'||kind==='fan'){const count=kind==='fan'?(e.type==='boss'?9:3):1;for(let i=0;i<count;i++){const angle=e.angle+(i-(count-1)/2)*(e.type==='boss'?.38:.26);this.projectiles.push({x:e.x,y:e.y,vx:Math.cos(angle)*185,vy:Math.sin(angle)*185,r:7,life:2.5,hostile:true,damage:e.damage,defense:e.battleId===this.combat?.nodeId});}}
      else if(kind==='charge'){const dx=e.attackX-e.x,dy=e.attackY-e.y,length=Math.hypot(dx,dy),range=Math.min(length,210),a=Math.atan2(dy,dx),sx=e.x,sy=e.y;this.move(e,Math.cos(a)*range,Math.sin(a)*range);const vx=e.x-sx,vy=e.y-sy,t=clamp(((p.x-sx)*vx+(p.y-sy)*vy)/(vx*vx+vy*vy||1),0,1);if(Math.hypot(p.x-sx-vx*t,p.y-sy-vy*t)<e.r+p.r+8)this.hurt(e.damage,e);if(this.combat?.integrity!==undefined&&e.battleId===this.combat.nodeId&&dist(e,this.combat)<65)this.damageDefense(e.damage*.55);this.effects.push({type:'charge',x:e.x,y:e.y,fromX:sx,fromY:sy,r:e.r,life:.25,maxLife:.25});}
      else{const target=kind==='burrow'||e.type==='boss'?{x:e.attackX,y:e.attackY}:e,radius=e.type==='boss'?105:kind==='burrow'?75:65;if(kind==='burrow'){const safe=this.freePosition(target.x,target.y,e.r);e.x=safe.x;e.y=safe.y;}this.effects.push({type:'impact',x:target.x,y:target.y,r:radius,life:.5,maxLife:.5});if(dist(p,target)<radius+p.r)this.hurt(e.damage,e);if(this.combat?.integrity!==undefined&&e.battleId===this.combat.nodeId&&dist(this.combat,target)<radius+25)this.damageDefense(e.damage*.55);}
      e.phase++;e.cooldown=e.type==='boss'?1.6:e.type==='shell'?2.0:1.5;
    }
    step(dt,input={}){
      if(this.dead||!finite(dt)||dt<=0)return;dt=Math.min(.05,dt);const p=this.player;const active=Object.values(input).some(Boolean)||this.combat||p.action||p.dashTime>0||this.enemies.some(e=>e.alive&&dist(e,p)<300);if(active)this.elapsed+=dt;this.noticeCooldown=Math.max(0,this.noticeCooldown-dt);
      for(const key of ['attackCooldown','spellCooldown','dashCooldown','dashTime','invulnerable','staminaDelay','guardCooldown','comboWindow','resonanceCooldown'])p[key]=Math.max(0,p[key]-dt);for(const key of Object.keys(p.buffs))p.buffs[key]=Math.max(0,p.buffs[key]-dt);
      this.block(!!input.block);if(p.guard)p.guardAge+=dt;
      if(p.action){const a=p.action;a.time+=dt;if(!a.hit&&a.time>=a.hitAt){a.hit=true;if(a.type==='attack')this.strike(a);if(a.type==='cast')this.releaseSpell(a);}if(a.time>=a.duration)p.action=null;}
      p.mp=Math.min(p.maxMp,p.mp+4*dt);if(p.staminaDelay<=0&&!p.action&&p.dashTime<=0)p.stamina=Math.min(p.maxStamina,p.stamina+(p.guard?4:this.weather==='cold'&&p.buffs.warm<=0?17:22)*dt);
      let dx=(input.right?1:0)-(input.left?1:0),dy=(input.down?1:0)-(input.up?1:0),len=Math.hypot(dx,dy);p.moving=len>0;
      if(p.dashTime>0)this.move(p,p.dashX*410*dt,p.dashY*410*dt);else if(len){dx/=len;dy/=len;if(!p.action)p.angle=Math.atan2(dy,dx);const speed=p.action?80:p.guard?95:185;this.move(p,dx*speed*dt,dy*speed*dt);p.walk+=dt*10;}
      if(input.attack)this.attack();if(input.magic)this.cast();
      const co=this.companion;co.moving=false;co.cooldown=Math.max(0,co.cooldown-dt);if(this.chapter>=2||this.bond>0){const d=dist(co,p);if(d>42){const a=Math.atan2(p.y-co.y,p.x-co.x);this.move(co,Math.cos(a)*Math.min(205,d*3)*dt,Math.sin(a)*Math.min(205,d*3)*dt);co.walk+=dt*8;co.moving=true;}if(d>500){co.x=p.x+30;co.y=p.y+20;}if(co.cooldown<=0){const e=this.enemies.find(e=>e.alive&&dist(e,co)<100);if(e){co.cooldown=Math.max(2.5,5-this.bond*.15);this.hitEnemy(e,12+this.bond*3,{element:'frost'});}}}
      for(const e of this.enemies){if(!e.alive)continue;e.flash=Math.max(0,e.flash-dt);e.cooldown-=dt;e.frost=Math.max(0,e.frost-dt);e.stunned=Math.max(0,e.stunned-dt);if(e.burn>0){e.burn-=dt;e.burnTick-=dt;if(e.burnTick<=0){e.burnTick=1;this.hitEnemy(e,7+this.talents.fire*3,{dot:true});}}if(!e.alive||e.stunned>0)continue;
        if(e.windup>0){e.windup-=dt;if(e.windup<=0)this.enemyStrike(e);continue;}
        const target=this.enemyTarget(e),d=dist(e,target),aggro=e.battleId?750:this.weather==='fog'?205:285;if(d>aggro){if(dist(e,{x:e.homeX,y:e.homeY})>12){const a=Math.atan2(e.homeY-e.y,e.homeX-e.x);this.move(e,Math.cos(a)*e.speed*.4*dt,Math.sin(a)*e.speed*.4*dt);}continue;}
        const targetRange=ENEMY[e.type].range;if(d<targetRange&&e.cooldown<=0)this.enemyTelegraph(e);else{const ranged=e.type==='spitter'||e.type==='wisp',desired=ranged?190:e.type==='boss'?150:e.r+p.r+10,dir=d<desired-30&&ranged?-1:d>desired?1:0;if(dir){const a=Math.atan2(target.y-e.y,target.x-e.x),speed=e.speed*(e.frost>0?.45:1);this.move(e,Math.cos(a)*speed*dt*dir,Math.sin(a)*speed*dt*dir);e.angle=a;}}
        if(this.dead)break;
      }
      for(const b of this.projectiles){b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<0||b.x>W||b.y<0||b.y>H)b.life=0;if(b.hostile){if(dist(b,p)<b.r+p.r){this.hurt(b.damage,b);b.life=0;}else if(b.defense&&this.combat?.integrity!==undefined&&dist(b,this.combat)<b.r+12){this.damageDefense(b.damage*.55);b.life=0;}}else{const e=this.enemies.find(e=>e.alive&&!e.underground&&dist(e,b)<e.r+b.r);if(e){this.hitEnemy(e,b.damage,{element:b.element});b.life=0;}}}
      this.projectiles=this.projectiles.filter(b=>b.life>0);for(const trap of this.traps){trap.life-=dt;const e=this.enemies.find(e=>e.alive&&!e.underground&&dist(e,trap)<trap.r+e.r);if(e){this.hitEnemy(e,38,{trap:true});trap.life=0;this.emit('sound',{name:'hit'});}}this.traps=this.traps.filter(t=>t.life>0);
      for(const fx of this.effects)fx.life-=dt;this.effects=this.effects.filter(f=>f.life>0);if(!this.dead)this.advanceBattle();
    }
    serialize(){this.storeRegion();return{version:VERSION,player:copy(this.player),chapter:this.chapter,unlocked:this.unlocked,progress:[...this.progress],sideProgress:{...this.sideProgress},completed:[...this.completed],started:[...this.started],battleReady:[...this.battleReady],rewardedKills:[...this.rewardedKills],choices:{...this.choices},flags:[...this.flags],inventory:{...this.inventory},buildings:[...this.buildings],garden:copy(this.garden),talents:{...this.talents},bond:this.bond,trust:this.trust,spell:this.spell,elapsed:Math.round(this.elapsed),dead:this.dead,finished:this.finished,stats:{...this.stats},regionStates:copy(this.regionStates),combat:this.combat?copy(this.combat):null,battleEnemies:copy(this.enemies.filter(e=>e.battleId)),traps:copy(this.traps)};}
    static fromSave(data){
      try{
        if(!data||data.version!==VERSION||!data.player||!Array.isArray(data.progress)||data.progress.length!==D.CHAPTERS.length)return null;
        const p=data.player;for(const key of ['x','y','hp','mp','stamina','level','xp','coins','potions'])if(!finite(p[key]))return null;
        if(!Number.isInteger(data.chapter)||!Number.isInteger(data.unlocked)||data.chapter<0||data.chapter>data.unlocked||data.unlocked>=D.CHAPTERS.length)return null;
        const g=new Campaign();g.progress=data.progress.map((n,i)=>{if(!Number.isInteger(n)||n<0||n>D.CHAPTERS[i].nodes.length)throw Error('progress');return n;});
        for(let i=0;i<data.unlocked;i++)if(g.progress[i]!==D.CHAPTERS[i].nodes.length)return null;for(let i=data.unlocked+1;i<D.CHAPTERS.length;i++)if(g.progress[i]!==0)return null;
        let expectedUnlock=0;while(expectedUnlock<D.CHAPTERS.length-1&&g.progress[expectedUnlock]===D.CHAPTERS[expectedUnlock].nodes.length)expectedUnlock++;if(data.unlocked!==expectedUnlock)return null;
        if(!data.sideProgress||typeof data.sideProgress!=='object')return null;for(const q of D.SIDEQUESTS){const n=data.sideProgress[q.id]??0;if(!Number.isInteger(n)||n<0||n>q.nodes.length||q.chapter>data.unlocked&&n>0)return null;g.sideProgress[q.id]=n;}
        const expected=new Set(D.CHAPTERS.flatMap((c,i)=>c.nodes.slice(0,g.progress[i]).map(n=>n.id)).concat(D.SIDEQUESTS.flatMap(q=>q.nodes.slice(0,g.sideProgress[q.id]).map(n=>n.id))));
        if(!Array.isArray(data.completed)||data.completed.length!==expected.size||data.completed.some(id=>!expected.has(id))||new Set(data.completed).size!==expected.size)return null;g.completed=expected;
        g.chapter=data.chapter;g.unlocked=data.unlocked;g.choices={};g.flags=new Set();let bond=0,trust=0;
        for(const id of expected){const n=g.getNode(id);if(n.choices?.length){const choice=n.choices.find(c=>c.id===data.choices?.[id]);if(!choice)return null;g.choices[id]=choice.id;const effect=choice.effect||{};bond+=effect.bond||0;trust+=effect.trust||0;if(effect.flag)g.flags.add(effect.flag);}}
        g.bond=clamp(bond,0,50);g.trust=clamp(trust,0,50);g.started=new Set(Array.isArray(data.started)?data.started.filter(id=>g.getNode(id)&&(expected.has(id)||g.eligibleAnywhere(id))):[]);for(const id of expected)g.started.add(id);
        g.battleReady=new Set(Array.isArray(data.battleReady)?data.battleReady.filter(id=>g.eligibleAnywhere(id)&&g.started.has(id)&&BATTLE_TYPES.has(g.getNode(id).type)):[]);
        g.rewardedKills=new Set(Array.isArray(data.rewardedKills)?data.rewardedKills.filter(id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id)).slice(0,2000):[]);
        const t=g.player;t.level=clamp(Math.floor(p.level),1,30);let budget=t.level-1;for(const id of Object.keys(g.talents)){const n=data.talents?.[id];g.talents[id]=Number.isInteger(n)?clamp(n,0,Math.min(TALENT_CAP,budget)):0;budget-=g.talents[id];}
        g.buildings=new Set(Array.isArray(data.buildings)?data.buildings.filter(id=>Object.hasOwn(DEFAULT_BUILDINGS,id)):[]);g.recalculate();t.x=clamp(p.x,45,W-45);t.y=clamp(p.y,55,H-45);if(g.solidAt(t.x,t.y,t.r)){t.x=CAMP.x;t.y=CAMP.y;}t.hp=clamp(p.hp,1,t.maxHp);t.mp=clamp(p.mp,0,t.maxMp);t.stamina=clamp(p.stamina,0,t.maxStamina);t.xp=clamp(p.xp,0,g.xpNeeded-1);t.coins=clamp(Math.floor(p.coins),0,99999);t.potions=clamp(Math.floor(p.potions),0,999);t.weapon=Object.hasOwn(WEAPON_DEFAULTS,p.weapon)?p.weapon:'sword';t.angle=finite(p.angle)?p.angle:0;t.invulnerable=2;t.resonanceCooldown=finite(p.resonanceCooldown)?clamp(p.resonanceCooldown,0,30):0;for(const k of Object.keys(t.buffs))t.buffs[k]=finite(p.buffs?.[k])?clamp(p.buffs[k],0,300):0;
        for(const id of ITEM_IDS){const n=data.inventory?.[id];g.inventory[id]=finite(n)?clamp(Math.floor(n),0,9999):0;}
        g.garden=Array.from({length:6},(_,i)=>{const plot=data.garden?.[i];return{planted:!!plot?.planted,growth:finite(plot?.growth)?clamp(plot.growth,0,2):0,crop:['grain','herb','mushroom'].includes(plot?.crop)?plot.crop:['grain','herb','mushroom'][i%3]};});
        g.spell=['fire','frost','lightning'].includes(data.spell)?data.spell:'fire';g.elapsed=finite(data.elapsed)?clamp(data.elapsed,0,1e8):0;g.finished=g.progress[D.CHAPTERS.length-1]===D.CHAPTERS[D.CHAPTERS.length-1].nodes.length;
        for(const key of Object.keys(g.stats)){const value=data.stats?.[key];g.stats[key]=finite(value)?clamp(key==='readSeconds'?value:Math.floor(value),0,999999):0;}
        function restoreEnemies(records,chapter,battle=false){if(!Array.isArray(records))return[];return records.slice(0,80).flatMap(raw=>{if(!raw||typeof raw.id!=='string'||!ENEMY[raw.type]||!finite(raw.x)||!finite(raw.y)||!finite(raw.hp))return[];const old=g.chapter;g.chapter=chapter;const e=g.makeEnemy(raw.type,raw.id,clamp(raw.x,45,W-45),clamp(raw.y,55,H-45),battle?raw.battleId:null);g.chapter=old;e.homeX=finite(raw.homeX)?clamp(raw.homeX,45,W-45):e.x;e.homeY=finite(raw.homeY)?clamp(raw.homeY,55,H-45):e.y;e.hp=clamp(raw.hp,0,e.maxHp);e.alive=raw.alive!==false&&e.hp>0;e.phase=Number.isInteger(raw.phase)?clamp(raw.phase,0,10000):0;return[e];});}
        g.regionStates={};for(let i=0;i<=g.unlocked;i++){const raw=data.regionStates?.[i];if(!raw)continue;const old=g.chapter;g.chapter=i;const base=g.createRegion(i);g.chapter=old;const harvest=new Set(Array.isArray(raw.resources)?raw.resources.filter(r=>r.harvested===true).map(r=>r.id):[]);base.resources.forEach(r=>r.harvested=harvest.has(r.id));const loaded=restoreEnemies(raw.enemies,i);base.enemies=base.enemies.map(e=>loaded.find(x=>x.id===e.id)||e);g.regionStates[i]=base;}
        g.loadRegion(data.chapter);g.companion.x=t.x+35;g.companion.y=t.y+20;
        if(data.combat){const b=data.combat,n=g.getNode(b.nodeId);if(!n||!g.eligibleNode(b.nodeId)||!BATTLE_TYPES.has(n.type)||g.battleReady.has(b.nodeId)||!g.started.has(b.nodeId)||!Number.isInteger(b.wave)||b.wave<1||b.wave>clamp(n.waves||1,1,4))return null;g.combat={nodeId:b.nodeId,wave:b.wave,total:clamp(n.waves||1,1,4)};if(n.type==='defend')Object.assign(g.combat,{integrity:finite(b.integrity)?clamp(b.integrity,1,100):100,x:n.x,y:n.y});g.spawnWave();const saved=restoreEnemies(data.battleEnemies,data.chapter,true);g.enemies=g.enemies.map(e=>e.battleId?(saved.find(x=>x.id===e.id&&x.battleId===e.battleId)||e):e);}
        g.traps=Array.isArray(data.traps)?data.traps.filter(t=>t&&finite(t.x)&&finite(t.y)&&finite(t.life)&&t.life>0).slice(0,5).map(t=>({x:clamp(t.x,45,W-45),y:clamp(t.y,55,H-45),life:clamp(t.life,0,180),r:35})):[];
        if(data.dead===true||p.hp<=0){g.dead=true;g.revive();}g.events=[];return g;
      }catch{return null;}
    }
  }
  const API={Campaign,W,H,CAMP,ENEMY,TALENT_CAP,clamp,dist};if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.MosslightJourney=API;
})(typeof globalThis!=='undefined'?globalThis:this);
