(function(){
  'use strict';
  const C=window.MosslightCore,$=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
  const audio=new window.ForestAudio(),voice=new window.StoryVoice(),S=window.MosslightStory,SAVE_KEY='mosslight-story-save-v2';
  let game=new C.Game(),screen='title',returnScreen='play',width=innerWidth,height=innerHeight,scale=1,dpr=1;
  let camera={x:630,y:1210},time=0,last=performance.now(),shake=0,saveTimer=0,hudTimer=0,toastTimers=[];
  const keys={},particles=[],floats=[],reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let storageAvailable=true;
  let cinema=null,cinemaZoom=1,hitPause=0,autoScenes=true,voiceEnabled=true,comboUntil=0;
  try{voiceEnabled=localStorage.getItem('mosslight-voice')!=='off';}catch{}
  function readSave(){try{const raw=localStorage.getItem(SAVE_KEY);return raw?C.Game.fromSave(JSON.parse(raw)):null;}catch{return null;}}
  function save(){if(game.dead)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(game.serialize()));$('save-status').textContent='旅途已记录';}catch{storageAvailable=false;$('save-status').textContent='此浏览器无法保存';}}
  function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);scale=width<700?1:width>1600?1.4:1.23;}
  addEventListener('resize',resize);resize();
  const terrain=document.createElement('canvas');terrain.width=C.W;terrain.height=C.H;const bg=terrain.getContext('2d');
  const rng=C.seeded(142857);
  function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);c.fill();}
  function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();}
  function line(c,points,color,w=1){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
  function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  function makeTerrain(){
    bg.fillStyle='#294a36';bg.fillRect(0,0,C.W,C.H);
    for(let i=0;i<780;i++){const x=rng()*C.W,y=rng()*C.H;ellipse(bg,x,y,20+rng()*110,12+rng()*60,['#31543a','#2d5038','#244530','#36543b','#203f30'][i%5]);}
    // Quiet clearings leave room for action and make destinations legible.
    ellipse(bg,605,1310,343,234,'#465a3b');ellipse(bg,430,490,145,120,'#3e5738');ellipse(bg,1540,1160,153,124,'#3b573a');
    const paths=[[[310,1330],[740,1330],[1135,1305],[1135,1120],[1135,880],[1135,775],[1135,485]],[[1135,1050],[1360,1060],[1530,1135]],[[430,485],[800,485],[1135,485],[1410,485],[1670,485],[2005,600],[2005,320]],[[1410,485],[1410,350]],[[550,1245],[610,1330]],[[800,1300],[790,1240]]];
    for(const p of paths){line(bg,p,'#223e2d',84);line(bg,p,'#64694a',73);line(bg,p,'#727252',57);}
    for(let i=0;i<21000;i++){
      const x=rng()*C.W,y=rng()*C.H;if(C.inWater(x,y))continue;
      const path=C.nearPath(x,y,-15);bg.fillStyle=path?['#a19b6d50','#4d5e3d60','#a2a07155'][i%3]:['#7a925b45','#142f2766','#9cae5b30','#4d70494d'][i%4];
      bg.fillRect(x,y,1+rng()*4,1+rng()*3);if(!path&&i%5===0)bg.fillRect(x+2,y-3,1,4);
    }
    // Stone paving in the ancient sanctuary.
    bg.fillStyle='#3c5142';bg.fillRect(1810,130,400,520);
    for(let y=145;y<650;y+=40)for(let x=1820;x<2200;x+=48){bg.fillStyle=(x+y)%3?'#536154':'#4b5d4d';bg.fillRect(x+(y%80?10:0),y,42,34);bg.fillStyle='#6f7b5d55';bg.fillRect(x+3,y+3,34,2);}
    ellipse(bg,2005,425,151,133,'#344e3c');bg.strokeStyle='#8ca07a66';bg.lineWidth=3;bg.beginPath();bg.ellipse(2005,425,145,128,0,0,Math.PI*2);bg.stroke();
    bg.beginPath();bg.ellipse(2005,425,117,102,0,0,Math.PI*2);bg.strokeStyle='#728a6466';bg.lineWidth=1;bg.stroke();
    bg.fillStyle='#183e3c';bg.fillRect(0,762,C.W,132);bg.fillStyle='#286360';bg.fillRect(0,775,C.W,105);
    for(let i=0;i<550;i++){const x=rng()*C.W,y=780+rng()*94;bg.fillStyle=['#43827855','#6ca48b33','#153f3e55'][i%3];bg.fillRect(x,y,8+rng()*33,2);}
    for(let x=0;x<C.W;x+=13){const h=3+rng()*9;bg.fillStyle='#748767';bg.fillRect(x,770-h,9,h);bg.fillStyle='#456343';bg.fillRect(x,880,10,h+4);}
    // Wooden bridge; collision follows its usable deck exactly.
    bg.fillStyle='#193b32';bg.fillRect(1053,758,164,141);bg.fillStyle='#655a3f';bg.fillRect(1063,752,144,148);
    for(let y=758;y<896;y+=12){bg.fillStyle=y%24?'#a08c5c':'#958356';bg.fillRect(1069,y,132,9);bg.fillStyle='#c1a77b55';bg.fillRect(1074,y+1,120,2);}
    for(const x of [1058,1203]){bg.fillStyle='#5b513a';bg.fillRect(x,745,7,160);for(let y=749;y<910;y+=38){bg.fillStyle='#c1ac7b';bg.fillRect(x-3,y,12,10);}}
    // Small crescent ruin pieces near the northern chest.
    for(const [x,y] of [[1345,300],[1480,300],[1355,410],[1480,410],[1840,180],[2170,180],[1840,600],[2170,600]]){bg.fillStyle='#1c362b';bg.fillRect(x-13,y-8,31,22);bg.fillStyle='#6c7c66';bg.fillRect(x-12,y-25,25,35);bg.fillStyle='#93a080';bg.fillRect(x-14,y-29,29,8);bg.fillStyle='#365640';bg.fillRect(x-11,y-5,14,13);}
    for(const f of C.SCENERY.flowers){if(C.inWater(f.x,f.y)||C.nearPath(f.x,f.y,-8))continue;if(f.color<2){bg.fillStyle=f.color?'#c1bb8177':'#b9cf9877';bg.fillRect(f.x,f.y,2,2);bg.fillStyle='#6a8954';bg.fillRect(f.x,f.y+2,1,4);}}
    // Camp clearing and worn stepping stones.
    ellipse(bg,C.FIRE.x,C.FIRE.y,48,32,'#5c6241');for(let i=0;i<9;i++){const a=i*Math.PI*2/9;ellipse(bg,C.FIRE.x+Math.cos(a)*28,C.FIRE.y+Math.sin(a)*18,7,5,'#929273');}
  }
  makeTerrain();
  const sprites={};
  function sprite(name,w,h,paint){const s=document.createElement('canvas');s.width=w;s.height=h;paint(s.getContext('2d'));sprites[name]=s;}
  function r(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  for(let variant=0;variant<4;variant++)sprite('tree'+variant,66,82,c=>{
    r(c,29,48,10,33,'#293b29');r(c,32,49,5,29,'#586145');r(c,34,53,2,24,'#777b52');r(c,24,76,20,4,'#283e2c');
    const tones=[['#183f31','#255039','#386341','#4b754a','#668252'],['#193b2e','#264a34','#365c3c','#4d7144','#6b8250'],['#173c30','#244d39','#356347','#4c7751','#6a8a5e'],['#17382b','#284a32','#3c603c','#557448','#748c54']][variant];
    polygon(c,[[12,61],[4,48],[9,34],[15,29],[12,18],[24,6],[38,4],[51,12],[55,27],[63,38],[59,54],[49,63]],tones[0]);
    ellipse(c,27,29,22,23,tones[1]);ellipse(c,43,35,18,23,tones[1]);ellipse(c,22,41,19,18,tones[2]);ellipse(c,40,25,18,18,tones[2]);ellipse(c,28,20,17,16,tones[3]);ellipse(c,17,34,12,10,tones[3]);ellipse(c,42,23,12,10,tones[3]);
    r(c,22,7,10,2,tones[4]);r(c,14,16,8,2,tones[4]);r(c,36,14,9,2,tones[4]);r(c,10,31,7,2,tones[4]);r(c,29,36,10,2,tones[4]);r(c,43,30,7,2,tones[4]);r(c,39,47,10,3,tones[0]);r(c,17,49,8,3,tones[0]);
  });
  function drawTree(o){const s=sprites['tree'+o.variant],f=o.size*1.65;const obscures=screen!=='title'&&Math.abs(game.player.x-o.x)<40*f&&game.player.y<o.y&&game.player.y>o.y-100*f;ctx.globalAlpha=obscures?.36:1;ctx.drawImage(s,o.x-33*f,o.y-77*f,66*f,82*f);ctx.globalAlpha=1;}
  sprite('house',92,100,c=>{
    r(c,14,42,66,49,'#263a2b');r(c,16,43,62,45,'#9a9369');r(c,19,48,56,37,'#b1a478');r(c,18,59,58,3,'#7d7956');r(c,18,76,58,3,'#7d7956');r(c,21,45,4,42,'#57543b');r(c,69,45,4,42,'#57543b');
    r(c,41,64,17,25,'#344331');r(c,44,66,11,21,'#655d40');r(c,52,77,2,2,'#e1c477');
    r(c,27,55,12,15,'#665b3c');r(c,29,57,8,11,'#e4c17a');r(c,32,57,2,11,'#8d8050');r(c,60,55,10,15,'#665b3c');r(c,62,57,6,11,'#e4c17a');
    polygon(c,[[5,49],[13,29],[36,5],[51,6],[87,40],[89,49]],'#293b2e');polygon(c,[[7,43],[36,8],[51,9],[85,42],[83,45],[8,46]],'#496344');
    for(let y=17;y<44;y+=7){const inset=(44-y)*.85;line(c,[[10+inset,y],[82-inset*.6,y]],y%2?'#637a4d':'#728654',3);}
    r(c,60,4,10,22,'#69745b');r(c,58,2,14,5,'#9a9d74');r(c,61,7,3,13,'#8d9270');r(c,40,88,20,5,'#a8a27b');r(c,13,86,16,6,'#34583a');r(c,66,84,16,7,'#3f6540');
  });
  function drawHouse(o,i){const f=1.55;ctx.drawImage(sprites.house,o.x-12,o.y-67,92*f,100*f);glow(o.x+46,o.y+30,39,'#e8c87b19');if(i<2){const t=time*.35+i;for(let j=0;j<3;j++)ellipse(ctx,o.x+91+Math.sin(t+j)*6,o.y-65-j*15-((time*8)%15),10+j*3,5+j*2,'#b3bea12b');}}
  function drawPerson(x,y,kind='hero',angle=0,walk=0,moving=false,pose='idle',ghost=false){
    const p=game.player,live=kind==='hero'&&screen!=='cinematic';
    window.MosslightActors.draw(ctx,{x,y,kind,angle,walk,moving,pose,ghost,
      action:live?p.action:null,dashTime:live?p.dashTime:0,invulnerable:live?p.invulnerable:0,sword:kind==='hero'&&p.sword},time);
  }
  function drawStorySite(site){
    const {x,y}=site,done=game.memories.has(site.id);
    if(site.id==='music'){
      ellipse(ctx,x,y+4,38,11,'#18352b88');r(ctx,x-34,y-13,68,10,'#8c7653');r(ctx,x-29,y-4,6,14,'#5e593f');r(ctx,x+23,y-4,6,14,'#5e593f');
      r(ctx,x-15,y-32,30,21,'#ad8b57');r(ctx,x-17,y-37,34,8,'#d0b078');r(ctx,x-12,y-28,24,12,'#485f4d');
      for(let i=0;i<5;i++)r(ctx,x-9+i*4,y-25,2,9,i%2?'#a6bf9c':'#e5d9a8');
      glow(x,y-29,60,done?'#e1c58b30':'#badaac28');if(!cinema)label(done?'母亲的音乐盒 · 重温':'母亲的音乐盒',x,y-62,'#e6d6ac',10);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;ellipse(ctx,x+Math.cos(a)*53,y+Math.sin(a)*22,3,2,['#e0b3a3','#d4d8a8','#9fbfba'][i%3]);}
    }else{
      ellipse(ctx,x,y+5,65,29,'#233e34');ellipse(ctx,x,y-4,56,27,'#82907a');ellipse(ctx,x,y-7,49,23,'#344e43');
      ctx.strokeStyle=done?'#d1e3b6':'#93b5a4';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(x,y-9,35,16,0,0,Math.PI*2);ctx.stroke();
      for(let i=0;i<3;i++){const mx=x+(i-1)*42,my=y-19+(i===1?-13:5);r(ctx,mx-3,my,6,20,'#a3a98a');ctx.save();ctx.translate(mx,my);ctx.rotate(game.mirrors[i]*Math.PI/2);polygon(ctx,[[-9,-12],[8,-12],[8,9],[-9,9]],'#a3bca9');r(ctx,-6,-9,11,15,done?'#d3eac6':'#7faeab');ctx.restore();}
      glow(x,y-20,72,done?'#c9e4ba44':'#a1cec122');if(!cinema)label(done?'我们的星图 · 重温':'旧塔星图',x,y-76,'#d3e2c4',10);
    }
    if(!cinema&&!done&&game.quest===1)label('◇',x,y-83+Math.sin(time*2)*3,'#e2c785',18);
  }
  function drawChest(chest){
    const opened=game.opened.has(chest.id),x=chest.x,y=chest.y;ellipse(ctx,x,y+3,19,7,'#142f2377');
    r(ctx,x-16,y-18,32,20,'#493e29');r(ctx,x-14,y-16,28,17,'#9e7d42');r(ctx,x-14,y-8,28,3,'#5b5031');
    r(ctx,x-11,y-16,3,17,'#d0b467');r(ctx,x+8,y-16,3,17,'#d0b467');r(ctx,x-3,y-10,6,7,'#e8cb7d');
    if(opened){r(ctx,x-15,y-26,30,10,'#765d36');r(ctx,x-12,y-22,24,6,'#302f20');}
    else{r(ctx,x-16,y-20,32,5,'#c5a05c');glow(x,y-13,48,chest.stone?'#b9dc9c20':'#edc77715');
      if(chest.stone){const bob=Math.sin(time*2+chest.x)*3;polygon(ctx,[[x,y-52+bob],[x+6,y-43+bob],[x,y-34+bob],[x-6,y-43+bob]],'#c9e5b4');glow(x,y-43,22,'#cfedb839');}}
  }
  function drawEnemy(e){
    const x=e.x,y=e.y,t=time*3+e.seed,bob=Math.sin(t)*2;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ellipse(ctx,0,2,e.r+3,e.r*.35,'#0e291f77');
    if(e.type==='slime'){
      const squash=e.windup>0?3:Math.sin(t)*1.4;polygon(ctx,[[-19,-3],[-18,-14+squash],[-12,-24+squash],[0,-28+squash],[12,-24+squash],[18,-15+squash],[20,-3],[11,2],[-10,2]],e.flash>0?'#e9ead0':'#789f67');
      ellipse(ctx,-3,-17+squash,12,9,e.flash>0?'#fff1cf':'#a2bd7e');r(ctx,-10,-15+squash,3,4,'#263d2e');r(ctx,5,-15+squash,3,4,'#263d2e');r(ctx,-4,-7+squash,6,2,'#4a7048');r(ctx,-5,-25+squash,7,2,'#d1db99');
    }else if(e.type==='wolf'){
      const face=game.player.x<e.x?-1:1;ctx.scale(face,1);const col=e.flash>0?'#f4e6c5':'#9ba28c';
      polygon(ctx,[[-24,-20],[-32,-27],[-28,-14],[-16,-8],[-10,1],[-5,0],[-5,-6],[11,-7],[14,1],[20,0],[21,-13],[28,-20],[20,-28],[18,-35],[12,-28],[4,-25]],col);
      polygon(ctx,[[-13,-22],[-3,-26],[12,-23],[15,-14],[-11,-11]],e.flash>0?'#fff1d2':'#c2c3a2');r(ctx,18,-24,3,3,'#d5bb68');r(ctx,25,-21,4,3,'#24382b');r(ctx,-8,-4,4,7,'#5f6d55');r(ctx,16,-5,4,7,'#5f6d55');
    }else{
      const col=e.flash>0?'#dfdfb5':'#718363';
      polygon(ctx,[[-40,0],[-23,-14],[-28,-54],[-45,-78],[-55,-83],[-48,-94],[-28,-81],[-20,-99],[-9,-95],[-8,-71],[10,-72],[18,-104],[30,-108],[29,-84],[49,-98],[55,-92],[34,-65],[29,-24],[47,-1],[25,3],[12,-10],[-9,-8],[-24,4]],'#344f38');
      polygon(ctx,[[-26,-5],[-16,-28],[-21,-65],[-13,-88],[-4,-66],[10,-64],[21,-86],[23,-50],[17,-25],[28,-4],[9,-10],[-7,-8]],col);
      r(ctx,-15,-48,11,4,'#e6d184');r(ctx,7,-48,11,4,'#e6d184');r(ctx,-4,-34,9,5,'#2c4531');
      ellipse(ctx,-26,-72,22,13,'#3f6740');ellipse(ctx,16,-88,25,13,'#507847');ellipse(ctx,36,-66,16,11,'#3a603c');r(ctx,-17,-17,5,8,'#98a16d');r(ctx,9,-58,4,13,'#9caa79');
      glow(0,-45,55,'#deca7d13');
    }
    if(e.hp<e.maxHp&&e.type!=='boss'){r(ctx,-18,-(e.type==='wolf'?43:35),36,3,'#172c21');r(ctx,-18,-(e.type==='wolf'?43:35),36*e.hp/e.maxHp,3,'#d6b078');}
    ctx.restore();
  }
  function drawBeacon(){
    const {x,y}=C.BEACON,lit=game.quest===4;ellipse(ctx,x,y+10,39,13,'#1c362c');
    r(ctx,x-31,y-4,62,14,'#6f7e66');r(ctx,x-26,y-10,52,9,'#98a183');r(ctx,x-15,y-79,30,68,'#5d7563');r(ctx,x-12,y-76,8,63,'#8a9a7c');r(ctx,x+7,y-70,5,56,'#425e4b');r(ctx,x-22,y-84,44,9,'#9aab8a');
    polygon(ctx,[[x-22,y-85],[x-15,y-115],[x,y-126],[x+17,y-115],[x+23,y-85]],'#395848');
    r(ctx,x-13,y-112,26,25,lit?'#e1c57d':'#718d72');r(ctx,x-3,y-115,6,31,'#c5d3a2');r(ctx,x-16,y-103,32,4,'#a7bb91');
    if(lit){glow(x,y-100,150,'#efd49055');glow(x,y-100,40,'#fff5be99');}else if(game.quest===3){glow(x,y-100,70,'#bddeab44');}
    if(game.quest<2){ctx.strokeStyle='#b9d3a077';ctx.lineWidth=2;ctx.setLineDash([8,10]);ctx.strokeRect(1810,130,400,520);ctx.setLineDash([]);glow(2005,650,70,'#a5d0a322');label('回忆封印 · 把三封信带回家',2005,674,'#c5d8b0',10);}
  }
  function label(text,x,y,color='#d7dfbf',size=10){ctx.font=`${size}px "Microsoft YaHei", sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#133126bb';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);}
  function visible(x,y,margin=160){return Math.abs(x-camera.x)<width/scale/2+margin&&Math.abs(y-camera.y)<height/scale/2+margin;}
  function drawWorld(){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.fillStyle='#18372c';ctx.fillRect(0,0,width,height);
    const s=screen==='title'?Math.max(.85,Math.min(1.15,width/1250)):screen==='cinematic'?cinemaZoom:scale;
    const sx=!reduced&&shake>0?(Math.random()-.5)*shake:0,sy=!reduced&&shake>0?(Math.random()-.5)*shake:0;
    ctx.save();ctx.translate(width/2+sx,height/2+sy);ctx.scale(s,s);ctx.translate(-camera.x,-camera.y);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(terrain,0,0);
    for(let i=0;i<45;i++){const x=(i*83+time*13)%C.W,y=788+(i*29)%80;if(x>1050&&x<1220)continue;ctx.fillStyle='#a2c6a627';ctx.fillRect(x,y,10+Math.sin(time+i)*5,1);}
    for(const o of C.SCENERY.trees)if(visible(o.x,o.y))ellipse(ctx,o.x+13,o.y+1,36*o.size,12*o.size,'#102a2766');
    for(const o of C.SCENERY.rocks)if(visible(o.x,o.y)){polygon(ctx,[[o.x-o.size,o.y],[o.x-o.size*.8,o.y-o.size*.7],[o.x,o.y-o.size],[o.x+o.size*.8,o.y-o.size*.5],[o.x+o.size,o.y]],'#6e7e60');line(ctx,[[o.x-o.size*.7,o.y-o.size*.6],[o.x,o.y-o.size*.85],[o.x+o.size*.5,o.y-o.size*.55]],'#9aa180',2);}
    if(screen!=='title')for(const e of game.enemies){if(!e.alive||e.windup<=0)continue;const full=e.type==='boss'?1.05:e.type==='wolf'?.5:.65,progress=1-e.windup/full;
      if(e.type==='boss'){
        const x=e.phase%2===0?e.attackX:e.x,y=e.phase%2===0?e.attackY:e.y,radius=e.phase%2===0?85:65;
        ellipse(ctx,x,y,radius,radius,'#e982731e');ctx.strokeStyle='#f0a08b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();ellipse(ctx,x,y,radius*progress,radius*progress,'#e9827338');
      }else{ellipse(ctx,e.x,e.y,e.r+18,e.r+18,'#e9827327');ctx.strokeStyle='#e6a17a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r+18,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();}}
    const drawables=[];
    for(const t of C.SCENERY.trees)if(visible(t.x,t.y))drawables.push({y:t.y,draw:()=>drawTree(t)});
    C.HOUSE_RECTS.forEach((o,i)=>{if(visible(o.x,o.y))drawables.push({y:o.y+o.h,draw:()=>drawHouse(o,i)});});
    for(const c of C.CHESTS)if(visible(c.x,c.y))drawables.push({y:c.y,draw:()=>drawChest(c)});
    for(const n of C.NPCS){if(n.id==='suwan'&&(game.companion.active||game.companion.joined))continue;if(cinema&&cinema.scene.actors.some(a=>a.kind===n.type))continue;drawables.push({y:n.y,draw:()=>drawPerson(n.x,n.y,n.type,Math.PI/2)});}
    for(const site of C.STORY_SITES)drawables.push({y:site.y,draw:()=>drawStorySite(site)});
    if(!cinema&&(game.companion.active||game.companion.joined)){const q=game.companion;drawables.push({y:q.y,draw:()=>drawPerson(q.x,q.y,'suwan',Math.atan2(game.player.y-q.y,game.player.x-q.x),q.walk,q.moving&&screen==='play')});}
    if(cinema){const focus=cinema.scene.lines[cinema.index];for(const actor of cinema.scene.actors){const progress=Math.min(1,cinema.elapsed/4),x=actor.x+((actor.toX??actor.x)-actor.x)*progress,y=actor.y+((actor.toY??actor.y)-actor.y)*progress;drawables.push({y,draw:()=>drawPerson(x,y,actor.kind,actor.kind==='hero'?-Math.PI/3:Math.PI/2,time*7,progress<1&&!!actor.toX,focus.speaker===actor.kind?focus.pose:'idle',actor.ghost)});}}
    drawables.push({y:C.BEACON.y,draw:drawBeacon});
    if(screen!=='title')for(const e of game.enemies)if(e.alive&&visible(e.x,e.y))drawables.push({y:e.y,draw:()=>drawEnemy(e)});
    const p=game.player;if(!cinema)drawables.push({y:p.y,draw:()=>drawPerson(p.x,p.y,'hero',p.angle,p.walk,p.moving&&screen==='play')});
    drawables.push({y:C.FIRE.y,draw:()=>{const {x,y}=C.FIRE;r(ctx,x-13,y-6,26,6,'#534531');line(ctx,[[x-10,y+1],[x+10,y-9]],'#8d7345',5);glow(x,y-14,80,'#f2b76628');polygon(ctx,[[x-13,y-6],[x-6,y-21],[x-3,y-14],[x+3,y-34-Math.sin(time*9)*4],[x+10,y-20],[x+14,y-6]],'#d69a4d');polygon(ctx,[[x-6,y-5],[x-4,y-17],[x+2,y-12],[x+5,y-25],[x+8,y-6]],'#efd78d');}});
    drawables.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
    if(screen!=='title'){
      for(const n of C.NPCS){if(cinema||(n.id==='suwan'&&(game.companion.active||game.companion.joined)))continue;label(n.name,n.x,n.y-80,'#ded8b7',10);const q=(n.id==='keeper'&&(game.quest===0||(game.quest===1&&game.memories.size===3)))||(n.id==='suwan'&&game.chapter===2);label(q?'!':'⋯',n.x,n.y-99+Math.sin(time*2)*3,q?'#f2ca78':'#bace9e',q?20:18);}
      for(const b of game.projectiles){glow(b.x,b.y,20,b.hostile?'#e49a7c45':'#b6e4bd55');ellipse(ctx,b.x,b.y,b.r,b.r,b.hostile?'#e4a486':'#d5f1bf');line(ctx,[[b.x,b.y],[b.x-b.vx*.025,b.y-b.vy*.025]],b.hostile?'#b86f5b':'#9ed7b4',3);}
      for(const fx of game.effects){const progress=1-fx.life/fx.maxLife;ctx.globalAlpha=1-progress;if(fx.type==='slash'){ctx.strokeStyle=game.player.sword?'#d5f3cd':'#efe3b4';ctx.lineWidth=8*(1-progress)+2;ctx.beginPath();ctx.arc(fx.x,fx.y,48+progress*16,fx.angle-1.15+progress*.5,fx.angle+1.1+progress*.5);ctx.stroke();}else{ctx.strokeStyle='#d8b58d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(fx.x,fx.y,fx.r*progress,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;}
    }
    for(const particle of particles){ctx.globalAlpha=Math.min(1,particle.life/particle.maxLife);ctx.fillStyle=particle.color;ctx.fillRect(particle.x,particle.y,particle.size,particle.size);}ctx.globalAlpha=1;
    for(const f of floats){ctx.globalAlpha=Math.min(1,f.life*2);label(f.text,f.x,f.y,f.color,f.text.length>6?10:13);}ctx.globalAlpha=1;
    // Fireflies live in world space, so they drift naturally as the camera moves.
    for(let i=0;i<55;i++){const x=(i*233+Math.sin(time*.4+i)*25)%C.W,y=(i*157+Math.cos(time*.3+i)*18)%C.H;if(!visible(x,y,20))continue;const a=(Math.sin(time*1.3+i)+1)*.25+.1;ctx.globalAlpha=a;ellipse(ctx,x,y,1.8,1.8,'#e9eab0');glow(x,y,13,'#d4e4a137');}ctx.globalAlpha=1;
    const shade=ctx.createLinearGradient(0,0,C.W,C.H);shade.addColorStop(0,'#244d3610');shade.addColorStop(1,'#082d2b1a');ctx.fillStyle=shade;ctx.fillRect(0,0,C.W,C.H);
    if(cinema){
      const mood=cinema.scene.mood,tint={memory:'#c59b6c1b',warm:'#deb57617',dawn:'#edcd8f29',storm:'#182b452b',stars:'#557b851a',river:'#dcada217'}[mood];if(tint){ctx.fillStyle=tint;ctx.fillRect(camera.x-width/s/2,camera.y-height/s/2,width/s,height/s);}
      if(mood==='river'||mood==='dawn'){for(let i=0;i<15;i++){const x=camera.x-260+(i*73)%520+Math.sin(time+i)*8,y=camera.y+70-((time*12+i*31)%250);glow(x,y,22,'#f3d29135');r(ctx,x-4,y-5,8,10,'#e2be7c');r(ctx,x-2,y-4,4,6,'#fff1bb');}}
      if(mood==='stars')for(let i=0;i<12;i++)label('✦',camera.x-220+i*41,camera.y-100+Math.sin(i*3)*65,'#d9e4bf',8);
    }
    // Slow, translucent sunbeams and windblown leaves give the woods depth.
    ctx.globalAlpha=.1;for(let i=0;i<3;i++)polygon(ctx,[[camera.x-420+i*240,camera.y-500],[camera.x-360+i*240,camera.y-500],[camera.x-110+i*240,camera.y+400],[camera.x-260+i*240,camera.y+400]],'#d4d7a1');ctx.globalAlpha=1;
    for(let i=0;i<9;i++){const x=camera.x-width/s/2+(time*19+i*157)%(width/s),y=camera.y-height/s/2+(time*25+i*97)%(height/s);ctx.save();ctx.translate(x,y);ctx.rotate(time*.7+i);ellipse(ctx,0,0,4,1.6,i%2?'#b99d6655':'#b1c18455');ctx.restore();}
    ctx.restore();
  }
  function toast(text,gold=false){const el=document.createElement('div');el.className='toast'+(gold?' gold':'');el.textContent=text;$('toasts').append(el);while($('toasts').children.length>3)$('toasts').firstChild.remove();toastTimers.push(setTimeout(()=>el.remove(),4300));}
  function clearKeys(){for(const key in keys)delete keys[key];}
  function consumeEvents(){
    for(const e of game.events.splice(0)){
      if(e.type==='sound')audio.play(e.name);
      else if(e.type==='toast')toast(e.text,e.gold);
      else if(e.type==='save')save();
      else if(e.type==='quest')updateHUD();
      else if(e.type==='float')floats.push({...e,life:1.2});
      else if(e.type==='shake')shake=reduced?0:e.amount;
      else if(e.type==='action'){$('combo-label').textContent=e.name;comboUntil=time+1.1;}
      else if(e.type==='burst'){if(e.count===8)hitPause=.045;for(let i=0;i<(reduced?5:e.count);i++){const a=Math.random()*Math.PI*2,s=25+Math.random()*85;particles.push({x:e.x,y:e.y-12,vx:Math.cos(a)*s,vy:Math.sin(a)*s-25,life:.4+Math.random()*.45,maxLife:.85,size:2+Math.random()*3,color:e.color});}}
      else if(e.type==='trail'&&!reduced)particles.push({x:e.x-5,y:e.y-13,vx:0,vy:0,life:.2,maxLife:.2,size:10,color:'#b5cda7'});
      else if(e.type==='memory'){playScene(e.id==='escort'?'river':e.id,()=>{toast('一段回忆，已收入手札 · 按 V 重温',true);if(e.id==='escort')toast('解锁 L · 同行共鸣，恢复生命并击退附近敌人',true);});}
      else if(e.type==='scene')playScene(e.id);
      else if(e.type==='replay')playScene(e.scene);
      else if(e.type==='escortFailed'){modal('河灯还没有熄灭','<p>苏晚退回了安全的河畔。已经取得的成长与回忆都保留。</p><p class="note">回到她身边可以重新出发。沿着小路慢慢走，别离她太远，优先处理靠近河灯的敌人。</p>','WE CAN TRY AGAIN');}
      else if(e.type==='death')showDeath();
      else if(e.type==='win')playScene('ending',showEnding);
    }
  }
  function questInfo(){
    if(game.quest===4)return ['尾声 · 写给明天','灯火长明。有人离开，也有人与你同行。','故事已完成 · V 重温回忆'];
    if(game.quest===3)return ['最后一盏灯','与苏晚一起点亮遗迹北端的灯塔','靠近灯塔后按 E'];
    if(game.quest===2)return ['最后的夜路','前往东北月痕遗迹，面对荒根守卫','L 同行共鸣 · N 分配天赋'];
    if(game.quest===0)return ['序章 · 灯还亮着','回家，与父亲林远说说话','靠近父亲后按 E'];
    if(!game.memories.has('music'))return ['第一封信 · 没说完的晚安','去西北的旧花园，修复母亲的音乐盒','M 查看地图 · 跨过中央木桥'];
    if(!game.memories.has('escort'))return ['第二封信 · 两个人的路',game.companion.active?'陪苏晚把河灯送到桥的南端':'去东南河畔见苏晚',game.companion.active?'别走太远，保护河灯的光':'不同的愿望，也可以一起走'];
    if(!game.memories.has('stars'))return ['第三封信 · 我们约好的天空','与苏晚前往北方旧塔，转动三面星镜','M 查看星台位置'];
    return ['终章前夜 · 未寄出的信','回萤火村，把回忆带给父亲','三封信已集齐 · 回家吧'];
  }
  function updateHUD(){
    const p=game.player;$('level-badge').textContent=p.level;$('level-label').textContent='LV. '+p.level;
    $('hp-bar').style.width=(p.hp/p.maxHp*100)+'%';$('hp-label').textContent=Math.ceil(p.hp)+' / '+p.maxHp;
    $('mp-bar').style.width=(p.mp/p.maxMp*100)+'%';$('mp-label').textContent=Math.floor(p.mp)+' / '+p.maxMp;
    $('xp-bar').style.width=(p.xp/game.xpNeeded*100)+'%';$('coin-count').textContent=p.coins;$('potion-count').textContent=p.potions;
    $('region-name').textContent=game.region;$('magic-cooldown').style.height=(p.spellCooldown/.8*100)+'%';$('dash-cooldown').style.height=(p.dashCooldown/1.5*100)+'%';$('resonance-cooldown').style.height=(p.resonanceCooldown/18*100)+'%';$('resonance-btn').disabled=!game.memories.has('escort');
    const q=questInfo();$('quest-title').textContent=q[0];$('quest-detail').textContent=q[1];$('quest-progress').textContent=q[2];
    const near=game.nearInteractable();$('interact-hint').hidden=screen!=='play'||!near;
    if(near)$('interact-hint').querySelector('span').textContent=near.type==='chest'?'打开 '+near.name:near.type==='memory'?'查看 '+near.name:near.id==='beacon'?'点亮灯塔':'与'+near.name.split(' · ')[1]+'交谈';
    const boss=game.enemies.find(e=>e.type==='boss');$('boss-hud').hidden=!boss.alive||!game.bossStarted||C.distance(p,boss)>470;$('boss-bar').style.width=(boss.hp/boss.maxHp*100)+'%';
    $('talent-dot').hidden=game.talentPoints===0;$('talent-btn').title='天赋 N · 可用 '+game.talentPoints+' 点';
    const co=game.companion;$('companion-hud').hidden=!co.active&&!co.joined;$('companion-bar').style.width=co.hp+'%';$('companion-state').textContent=co.active?(C.distance(co,p)>230?'回到苏晚身边':'护灯同行'):'与你同行 · L 共鸣';
    if(time>comboUntil)$('combo-label').textContent='';
  }
  function paintPortrait(canvas,kind){window.MosslightPortrait?.draw(canvas,kind);}
  function makeButton(text,handler,className='primary'){const b=document.createElement('button');b.textContent=text;b.className=className;b.onclick=()=>{audio.play('select');handler();};return b;}
  function updateVoiceButton(){$('voice-toggle').textContent='配音 '+(voiceEnabled?'开':'关');$('voice-toggle').setAttribute('aria-label',voiceEnabled?'关闭配音':'开启配音');voice.setMuted(!voiceEnabled||audio.muted);}
  function playScene(id,onFinish){
    const scene=S.SCENES[id];if(!scene){onFinish?.();return;}
    voice.stop();clearKeys();$('dialogue').hidden=true;$('modal-shade').hidden=true;$('title-screen').hidden=true;$('cinema').hidden=false;$('hud').style.opacity='0';$('interact-hint').hidden=true;
    screen='cinematic';$('hud').inert=true;cinema={id,scene,index:0,elapsed:0,lineElapsed:0,done:false,silent:false,onFinish};cinemaZoom=width<700?1.15:1.5;showSceneLine();
  }
  function showSceneLine(){
    if(!cinema)return;const shot=cinema,line=shot.scene.lines[shot.index],cast=S.CAST[line.speaker];shot.lineElapsed=0;shot.done=false;shot.silent=!voiceEnabled||audio.muted;
    $('scene-title').textContent=shot.scene.title;$('scene-place').textContent=shot.scene.place;$('scene-speaker').textContent=cast.name;$('scene-speaker').style.color=cast.color;$('scene-role').textContent=cast.role;
    $('scene-text').textContent=line.text;$('scene-progress').style.width=((shot.index+1)/shot.scene.lines.length*100)+'%';paintPortrait($('scene-portrait'),line.speaker);updateVoiceButton();
    if(audio.ctx){audio.music.gain.cancelScheduledValues(audio.ctx.currentTime);audio.music.gain.setTargetAtTime(.1,audio.ctx.currentTime,.06);}
    const index=shot.index;$('voice-status').textContent=shot.silent?'配音已关闭 · 字幕保留':'中文合成配音';
    if(!shot.silent)voice.speak(line,{onEnd:()=>{if(cinema===shot&&shot.index===index)shot.done=true;},onStatus:status=>{if(cinema===shot&&shot.index===index){$('voice-status').textContent='合成配音 · '+status;if(status==='不可用')shot.silent=true;}}}).then(ok=>{if(!ok&&cinema===shot&&shot.index===index)shot.silent=true;});
  }
  function nextSceneLine(){if(!cinema)return;voice.stop();if(cinema.index+1<cinema.scene.lines.length){cinema.index++;showSceneLine();}else finishScene();}
  function finishScene(){
    if(!cinema)return;const finished=cinema;voice.stop();cinema=null;game.seen.add(finished.id);$('cinema').hidden=true;$('hud').style.opacity='';$('hud').inert=false;screen='play';clearKeys();
    if(finished.id==='homecoming'){game.player.x=590;game.player.y=1290;}
    if(audio.ctx)audio.music.gain.setTargetAtTime(.34,audio.ctx.currentTime,.2);
    finished.onFinish?.();consumeEvents();save();updateHUD();if(screen==='play')canvas.focus();
  }
  function startGame(saved=false){
    audio.start();voice.stop();cinema=null;game=saved?readSave()||new C.Game():new C.Game();screen='play';clearKeys();particles.length=0;floats.length=0;
    camera.x=game.player.x;camera.y=game.player.y;$('title-screen').hidden=true;$('hud').hidden=false;$('hud').style.opacity='';$('modal-shade').hidden=true;$('dialogue').hidden=true;$('cinema').hidden=true;
    $('toasts').replaceChildren();toastTimers.forEach(clearTimeout);toastTimers=[];paintPortrait($('hero-avatar'),'hero');updateHUD();save();
    if(game.quest===4){playScene('ending',showEnding);return;}
    const pending=!game.seen.has('homecoming')?'homecoming':game.memories.has('music')&&!game.seen.has('music')?'music':game.memories.has('escort')&&!game.seen.has('river')?'river':game.memories.has('stars')&&!game.seen.has('stars')?'stars':null;
    if(pending)playScene(pending);else{toast('WASD 移动 · E 交谈 · J 连击 · K 法术 · N 天赋',true);canvas.focus();}
  }
  function returnTitle(){save();voice.stop();cinema=null;screen='title';clearKeys();$('title-screen').hidden=false;$('hud').hidden=true;$('cinema').hidden=true;$('hud').style.opacity='';$('modal-shade').hidden=true;$('dialogue').hidden=true;updateContinue();audio.resume();}
  function updateContinue(){const saved=readSave();$('continue-btn').hidden=!saved;$('start-btn').firstChild.textContent=saved?'开启新故事 ':'翻开这封信 ';}
  function modal(title,html,kicker='LETTERS ON THE WAY HOME',canClose=true){
    if(screen!=='modal')returnScreen=screen;screen='modal';clearKeys();$('dialogue').hidden=true;$('modal-title').textContent=title;$('modal-kicker').textContent=kicker;$('modal-content').innerHTML=html;$('modal-close').hidden=!canClose;$('modal-shade').hidden=false;
    requestAnimationFrame(()=>{$('modal').querySelector('button:not([hidden])')?.focus();});
  }
  function closeModal(){if($('modal-close').hidden)return;$('modal-shade').hidden=true;screen=returnScreen==='title'?'title':'play';clearKeys();audio.resume();canvas.focus();}
  function showGuide(){audio.start();modal('这一次，把话说在现在',`<p>林舟返乡后，循着母亲的音乐盒、苏晚的河灯和两人留下的星图，重新理解那些未说出口的爱。</p><div class="guide-grid"><p><kbd>WASD</kbd>移动</p><p><kbd>J / 空格</kbd>三式连击</p><p><kbd>K</kbd>蓄力萤火术</p><p><kbd>Shift</kbd>翻滚闪避</p><p><kbd>E</kbd>交谈 / 探索</p><p><kbd>Q</kbd>治疗药水</p><p><kbd>L</kbd>同行共鸣</p><p><kbd>N</kbd>成长天赋</p><p><kbd>V</kbd>回忆手札</p><p><kbd>M / I</kbd>地图 / 背包</p></div><p class="note">连续按住 J 会依次使出斜斩、回身斩和重击。法术有蓄力动作，翻滚可以取消动作。观察敌人的地面预警，再选择反击时机。</p><p class="voice-note">主线演出含 38 句中文合成配音，可关闭、跳过、手动推进，也能在手札里重温。每个章节的玩法都不同，完成故事也能获得经验。新故事使用独立存档。</p>`,'YOUR STORY BEGINS HERE');}
  function showPause(){if(screen!=='play')return;modal('灯还亮着，歇一会儿','<p>旅途已保存。准备好后，我们继续走。</p>','TAKE YOUR TIME');save();audio.pause();voice.pause();$('modal-content').append(makeButton('继续旅程 →',closeModal),makeButton('回到信的开头',returnTitle,'secondary'));}
  function showBag(){if(screen!=='play')return;const p=game.player;modal('旅人的行囊',`<div class="bag-grid"><div class="bag-item"><b>⚔</b><span>${p.sword?'父亲的月辉剑':'旧日短剑'}</span><small>已装备</small></div><div class="bag-item"><b>♜</b><span>药水 ×${p.potions}</span><small>恢复 60 生命</small></div><div class="bag-item"><b>✉</b><span>回忆 ${game.memories.size}/3</span><small>按 V 重温</small></div></div><div class="stats"><span>等级 <b>Lv.${p.level}</b></span><span>攻击 <b>${game.damage}</b></span><span>生命 <b>${Math.ceil(p.hp)} / ${p.maxHp}</b></span><span>魔力 <b>${Math.floor(p.mp)} / ${p.maxMp}</b></span><span>经验 <b>${p.xp} / ${game.xpNeeded}</b></span><span>金币 <b>${p.coins}</b></span></div><p class="note">成长既来自战斗，也来自修复记忆、守护同行人和解开星图。每次升级获得 1 点天赋。</p>`,'WHAT WE CARRY');const b=makeButton('使用一瓶药水',()=>{game.potion();consumeEvents();screen='play';showBag();});b.disabled=!p.potions||p.hp>=p.maxHp;$('modal-content').append(b);}
  function showTalents(){if(screen!=='play')return;modal('把成长，交给自己的选择',`<p class="talent-points">可分配天赋：${game.talentPoints} 点</p><div class="talent-list"></div>`,'GROW IN YOUR OWN WAY');
    const icons={blade:'⚔',fire:'✧',heart:'❦'};for(const [id,t]of Object.entries(C.TALENTS)){const card=document.createElement('div');card.className='talent-card';card.innerHTML=`<header><span>${icons[id]} ${t.name}</span><small>${game.talents[id]} / 3</small></header><p>${t.description}</p>`;const b=makeButton(game.talents[id]>=3?'已掌握':'学习 · 1 天赋点',()=>{game.learnTalent(id);consumeEvents();screen='play';showTalents();},'');b.disabled=game.talentPoints<=0||game.talents[id]>=3;card.append(b);$('modal-content').querySelector('.talent-list').append(card);}
  }
  function showJournal(){if(screen!=='play')return;modal('归途手札','<p class="chapter-count">那些值得记住的，小小的事。</p><div id="journal-entries"></div><p class="voice-note">回忆可重温。演出使用中文合成语音，并非真人配音。</p>','LETTERS WE KEEP');
    for(const entry of S.JOURNAL){const got=game.memories.has(entry.id),el=document.createElement('article');el.className='journal-entry';el.innerHTML=`<h3>${got?entry.title:'尚未打开的一封信'}</h3><p>${got?entry.body:'继续旅途，这页故事会在你们的脚步之间慢慢写下。'}</p>`;if(got)el.append(makeButton('重温这一幕 →',()=>playScene(entry.id==='escort'?'river':entry.id),''));$('journal-entries').append(el);}
    for(const id of ['homecoming','father','ending'])if(game.seen.has(id))$('modal-content').append(makeButton('重温 · '+S.SCENES[id].title,()=>playScene(id),'text-button'));
  }
  function showMap(){if(screen!=='play')return;modal('把归途画在纸上','<canvas id="map-canvas" class="map-canvas" width="720" height="540" aria-label="地图：西南村庄，西北音乐盒，东南苏晚，中央桥梁，北方星台，东北灯塔。"></canvas><div class="map-legend"><span>✦ 林舟</span><span>◇ 故事地点</span><span>◆ 月痕遗迹</span></div><p class="note">先去西北听母亲的曲子，再去东南与苏晚同行，最后前往北方星台。中央木桥连接河的两岸。</p>','WHERE OUR STORIES MEET');
    const m=$('map-canvas').getContext('2d'),s=720/C.W;m.drawImage(terrain,0,0,720,540);m.fillStyle='#15352870';m.fillRect(0,0,720,540);
    for(const t of C.SCENERY.trees)ellipse(m,t.x*s,t.y*s,3,4,'#507047');
    const marks=[['家 · 父亲',550,1240,'#e7d8a1'],['母亲的音乐盒',430,480,'#e5c4a2'],['苏晚 · 河灯',1550,1160,'#e7bab2'],['星台',1410,360,'#c3e0cc'],['木桥',1135,820,'#c3e0cc'],['月痕遗迹',2005,415,'#e5a18b']];
    m.textAlign='center';m.font='13px "Microsoft YaHei"';for(const [name,x,y,col]of marks){ellipse(m,x*s,y*s,4,4,col);m.fillStyle=col;m.fillText(name,x*s,y*s-13);}
    const p=game.player;ellipse(m,p.x*s,p.y*s,7,7,'#e3efc0');ellipse(m,p.x*s,p.y*s,3,3,'#244936');
  }
  function showMusicPuzzle(){
    modal('那支没唱完的摇篮曲',`<p class="puzzle-clue">“雨落窗前，风过树林，<br>最后一盏灯，替我说晚安。”</p><div class="note-sequence">${[0,1,2].map((_,i)=>'<i>'+(['雨','灯','林'][game.musicNotes[i]]||'·')+'</i>').join('')}</div><div class="memory-notes"></div><p class="note">按照母亲歌词中的顺序，轻轻按下三个音符。也可以只看文字解开，不需要辨别声音。</p>`,'THE LULLABY SHE LEFT');
    for(const [i,name,icon]of [[0,'雨','☂'],[1,'灯','♧'],[2,'林','♬']]){const b=makeButton('',()=>{audio.tone([523.25,783.99,659.25][i],.8,.12);const done=game.musicNote(i);if(!done)showMusicPuzzle();consumeEvents();},'note-key');b.innerHTML=`<span>${icon}</span><small>${name}</small>`;$('modal-content').querySelector('.memory-notes').append(b);}
  }
  function showStarPuzzle(){
    modal('让我们的星光再次相遇','<p class="puzzle-clue">“你向东看海，我向北寻灯，<br>归途的风，从西边来。”</p><div class="mirror-row"></div><p class="note">左镜朝东，中镜朝北，右镜朝西。点击镜子顺时针转动，让三束光在星台相遇。</p>','THE SKY WE ONCE PROMISED');
    game.mirrors.forEach((n,i)=>{const b=makeButton('',()=>{game.mirrors[i]=(n+1)%4;audio.tone(440+i*110,.25,.08);save();showStarPuzzle();},'mirror-button'+(n===[1,0,3][i]?' aligned':''));b.innerHTML=`<small>${['左镜','中镜','右镜'][i]}</small><b>${['↑','→','↓','←'][n]}</b><small>${['北','东','南','西'][n]}</small>`;$('modal-content').querySelector('.mirror-row').append(b);});
    $('modal-content').append(makeButton('让星光相遇 ✧',()=>{game.alignStars();consumeEvents();}));
  }
  function showDialogue(speaker,text,choices,kind='narrator'){
    screen='dialogue';clearKeys();$('speaker-name').textContent=speaker;$('dialogue-text').textContent=text;$('dialogue-actions').replaceChildren();$('dialogue').hidden=false;$('interact-hint').hidden=true;
    const pic=document.createElement('canvas');$('dialogue').querySelector('.dialogue-portrait').replaceChildren(pic);paintPortrait(pic,kind);
    for(const [label,fn]of choices){const b=makeButton(label,()=>{$('dialogue').hidden=true;screen='play';clearKeys();fn?.();consumeEvents();updateHUD();if(screen==='play')canvas.focus();},'');$('dialogue-actions').append(b);}requestAnimationFrame(()=>$('dialogue-actions').firstElementChild?.focus());
  }
  function choosePromise(){
    modal('把愿望，说给身边的人听','<p>苏晚握着那张旧星图。父亲把灯芯剪短了一点，像是终于舍得让夜过去。</p><p class="puzzle-clue">“等天亮以后，你想先做什么？”</p>','A PROMISE MADE TODAY',false);
    for(const [id,text]of [['sea','先陪父亲吃早饭，再和苏晚去看海。'],['home','把老屋修成书店，再和苏晚慢慢走遍远方。']])$('modal-content').append(makeButton(text,()=>{game.promise=id;game.turnIn();$('modal-shade').hidden=true;screen='play';consumeEvents();save();canvas.focus();},'bond-choice'));
  }
  function interact(){
    if(screen!=='play')return;const item=game.interact();consumeEvents();if(!item||item.type==='loot'||item.type==='win')return;
    if(item.id==='music'){showMusicPuzzle();return;}if(item.id==='stars'){showStarPuzzle();return;}
    if(item.id==='keeper'){
      if(game.quest===0)playScene('letter',()=>{game.acceptQuest();toast('第一封信 · 去西北旧花园听一听母亲的曲子',true);});
      else if(game.quest===1&&game.memories.size===3)playScene('father',choosePromise);
      else showDialogue('林远 · 父亲',game.quest===1?'花园、河灯、旧星图……你娘总说，人心里放得下的东西，比一只行囊多得多。\n累了就回家。饭可以再热，灯也一直亮着。':'剑不只是为了赢。是为了在重要的人身边，多站一会儿。\n最后的夜路，和苏晚一起走吧。',[['坐下来歇一会儿',()=>{game.rest();toast('父亲热好了饭 · 生命与魔力恢复');}],['我一会儿就回来']],'father');
    }else if(item.id==='suwan'){
      if(!game.memories.has('music'))showDialogue('苏晚','我替你带了一盏河灯。不过，先去花园看看吧。你母亲的音乐盒，还在那里等着你。',[['我会回来找你']],'suwan');
      else if(!game.memories.has('escort')){
        const begin=()=>{game.startEscort();toast('护灯同行 · 沿小路前往中央桥梁南端，别离苏晚太远',true);};
        if(game.seen.has('reunion'))showDialogue('苏晚','河灯还亮着。我们慢慢走，不着急。',[['一起送灯到桥下',begin],['稍等我一下']],'suwan');else playScene('reunion',begin);
      }else showDialogue('苏晚',game.memories.has('stars')?'我想要的未来里，有书，有海，也有你。只是这一次，我们都别再替对方猜答案了。':'旧塔的三面镜子还记得我们小时候的方向：海在东，灯在北，回家的风在西。',[['谢谢你愿意和我一起走',()=>{game.player.hp=Math.min(game.player.maxHp,game.player.hp+15);}],['重温桥下的那盏灯',()=>playScene('river')]],'suwan');
    }else if(item.id==='merchant')showDialogue(item.name,`想照顾别人，也要记得照顾自己。\n一瓶林间药水恢复 60 点生命，需要 12 金币。你有 ${game.player.coins} 金币。`,[['买一瓶药水',()=>{if(game.buyPotion())toast('获得林间药水 ×1');}],['谢谢，下次再来']],'mother');
  }
  function showDeath(){screen='dead';voice.stop();modal('有人在等你回家','<div class="ending-mark">✧</div><p class="end-copy">夜路很长，偶尔停下来也没关系。<br>你没有失去已经走过的路。</p><p class="note">在村庄醒来，保留等级、天赋、回忆和装备，失去 10% 金币。若正在护灯，苏晚会在河畔等你。</p>','THE LIGHT IS STILL ON',false);$('modal-content').append(makeButton('回到灯亮着的地方 →',()=>{game.revive();screen='play';$('modal-shade').hidden=true;camera.x=game.player.x;camera.y=game.player.y;consumeEvents();updateHUD();canvas.focus();}));}
  function showEnding(){
    screen='win';save();const promise=game.promise==='home'?'后来，老屋成了小小的书店。靠窗放着父亲的茶杯，门口写着：出门看海，过些日子回来。':'后来，他们一起去看了海。寄回家的每一封信，都不再只有一句“我很好”。';
    modal('把爱，说在来得及的时候',`<div class="ending-mark">❦</div><p class="end-copy">母亲没能看见新的灯塔。<br>但她教会的温柔，留在了他们身上。<br><br>${promise}</p><div class="end-stats"><div><b>${game.player.level}</b><small>旅人等级</small></div><div><b>3</b><small>珍藏的回忆</small></div><div><b>${Math.max(1,Math.ceil(game.elapsed/60))}</b><small>冒险分钟</small></div></div><p class="voice-note">《苔灯之森：归途来信》· 完<br>主线配音为中文神经合成语音。谢谢你，把这封信读到了最后。</p>`,'LETTERS TO TOMORROW',false);$('modal-content').append(makeButton('合上信，带着故事回家 →',returnTitle));
  }
  function input(){return {up:keys.KeyW||keys.ArrowUp,down:keys.KeyS||keys.ArrowDown,left:keys.KeyA||keys.ArrowLeft,right:keys.KeyD||keys.ArrowRight,attack:keys.KeyJ||keys.Space,magic:keys.KeyK};}
  function action(name){if(screen!=='play')return;audio.start();if(name==='attack')game.attack();if(name==='magic')game.cast();if(name==='dash'){const i=input();game.dash((i.right?1:0)-(i.left?1:0),(i.down?1:0)-(i.up?1:0));}if(name==='potion')game.potion();if(name==='resonance')game.resonance();consumeEvents();updateHUD();canvas.focus();}
  $('start-btn').onclick=()=>{audio.start();if(readSave()){modal('翻开一封新的信？','<p>这将从序章开始，并覆盖当前故事篇存档。</p>','A NEW LETTER');$('modal-content').append(makeButton('开启新故事',()=>startGame(false)),makeButton('保留这段旅途',closeModal,'secondary'));}else startGame(false);};
  $('continue-btn').onclick=()=>startGame(true);$('how-btn').onclick=showGuide;$('modal-close').onclick=closeModal;$('pause-btn').onclick=showPause;$('map-btn').onclick=showMap;$('bag-btn').onclick=showBag;$('journal-btn').onclick=showJournal;$('talent-btn').onclick=showTalents;
  $('sound-btn').onclick=()=>{audio.start();audio.setMuted(!audio.muted);updateSound();updateVoiceButton();};
  function updateSound(){$('sound-btn').textContent=audio.muted?'♪̸':'♫';$('sound-btn').setAttribute('aria-label',audio.muted?'开启声音':'关闭声音');}
  $('scene-next').onclick=nextSceneLine;$('scene-skip').onclick=finishScene;$('scene-auto').onclick=()=>{autoScenes=!autoScenes;$('scene-auto').textContent='自动播放 '+(autoScenes?'开':'关');};
  $('voice-toggle').onclick=()=>{voiceEnabled=!voiceEnabled;try{localStorage.setItem('mosslight-voice',voiceEnabled?'on':'off');}catch{}updateVoiceButton();if(cinema){if(voiceEnabled)showSceneLine();else{cinema.silent=true;$('voice-status').textContent='配音已关闭 · 字幕保留';}}};
  for(const a of ['attack','magic','dash','potion','resonance'])$(a+'-btn').onclick=()=>action(a);
  $('interact-hint').onclick=interact;$('touch-interact').onclick=interact;
  for(const b of document.querySelectorAll('[data-move]')){const code={up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD'}[b.dataset.move];b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[code]=true;};b.onpointerup=b.onpointercancel=()=>{keys[code]=false;};}
  addEventListener('keydown',e=>{
    const controlled=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyJ','KeyK','KeyE','KeyQ','KeyI','KeyM','KeyN','KeyV','KeyL','ShiftLeft','ShiftRight','Escape'];if(controlled.includes(e.code)&&screen!=='title')e.preventDefault();
    if(screen==='cinematic'){if(!e.repeat&&(e.code==='Space'||e.code==='KeyE'||e.code==='Enter'))nextSceneLine();else if(!e.repeat&&e.code==='Escape'){autoScenes=!autoScenes;$('scene-auto').textContent='自动播放 '+(autoScenes?'开':'关');}return;}
    if(screen==='play'){keys[e.code]=true;if(e.repeat)return;const map={KeyE:interact,KeyQ:()=>action('potion'),KeyL:()=>action('resonance'),KeyI:showBag,KeyM:showMap,KeyN:showTalents,KeyV:showJournal,Escape:showPause};if(e.code.startsWith('Shift'))action('dash');else map[e.code]?.();}
    else if(screen==='dialogue'&&!e.repeat&&(e.code==='KeyE'||e.code==='Space'))$('dialogue-actions').firstElementChild?.click();
    else if(screen==='dialogue'&&e.code==='Escape'){$('dialogue').hidden=true;screen='play';clearKeys();}
    else if(screen==='modal'&&!e.repeat&&['Escape','KeyI','KeyM','KeyN','KeyV'].includes(e.code))closeModal();
  });
  addEventListener('keyup',e=>{delete keys[e.code];});let sceneSuspended=false;
  addEventListener('blur',()=>{clearKeys();if(screen==='play')showPause();if(screen==='cinematic')sceneSuspended=true;audio.pause();voice.pause();});
  addEventListener('focus',()=>{if(screen==='cinematic'){sceneSuspended=false;audio.resume();voice.resume();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearKeys();if(screen==='play')showPause();sceneSuspended=true;save();audio.pause();voice.pause();}else{sceneSuspended=false;if(screen==='title'||screen==='dialogue'||screen==='cinematic'){audio.resume();voice.resume();}}});
  addEventListener('pagehide',()=>{if(screen!=='title')save();voice.stop();});
  function frame(now){
    const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;hitPause=Math.max(0,hitPause-dt);
    if(screen==='play'&&hitPause===0){game.step(dt,input());consumeEvents();saveTimer+=dt;if(saveTimer>8){save();saveTimer=0;}}
    if(screen==='cinematic'&&cinema&&!sceneSuspended){const c=cinema;c.elapsed+=dt;c.lineElapsed+=dt;const line=c.scene.lines[c.index];const wait=Math.max(4,line.text.length*.115+1.5);if(autoScenes&&((c.done&&c.lineElapsed>1.8)||(c.silent&&c.lineElapsed>wait)))nextSceneLine();}
    if(screen==='title'){const tx=width<800?680:510;camera.x+=(tx+Math.sin(time*.1)*12-camera.x)*.035;camera.y+=(1200+Math.cos(time*.1)*10-camera.y)*.035;}
    else if(cinema){const line=cinema.scene.lines[cinema.index];camera.x+=(line.x-camera.x)*(1-Math.exp(-dt*(reduced?10:1.5)));camera.y+=(line.y-35-camera.y)*(1-Math.exp(-dt*(reduced?10:1.5)));}
    else{const vw=width/scale/2,vh=height/scale/2;const tx=C.clamp(game.player.x,Math.min(vw,C.W/2),Math.max(C.W/2,C.W-vw)),ty=C.clamp(game.player.y,Math.min(vh,C.H/2),Math.max(C.H/2,C.H-vh));camera.x+=(tx-camera.x)*(1-Math.exp(-dt*9));camera.y+=(ty-camera.y)*(1-Math.exp(-dt*9));}
    if(screen==='play'||screen==='title'||screen==='cinematic'){
      for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=55*dt;if(p.life<=0)particles.splice(i,1);}
      for(let i=floats.length-1;i>=0;i--){floats[i].life-=dt;floats[i].y-=25*dt;if(floats[i].life<=0)floats.splice(i,1);}
    }
    shake=Math.max(0,shake-dt*20);audio.update();drawWorld();hudTimer+=dt;if(screen!=='title'&&hudTimer>.08){updateHUD();hudTimer=0;}requestAnimationFrame(frame);
  }
  updateContinue();updateSound();updateVoiceButton();paintPortrait($('hero-avatar'),'hero');requestAnimationFrame(frame);
})();
