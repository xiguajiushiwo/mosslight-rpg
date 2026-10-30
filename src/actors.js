(function(root){
  'use strict';
  const palettes={hero:{hair:'#333f36',skin:'#dfbf95',coat:'#5d8469',light:'#a4bc92',scarf:'#ead8ad'},father:{hair:'#a0a38b',skin:'#c5a47e',coat:'#75694e',light:'#a49b77',scarf:'#b5b49a'},mother:{hair:'#70564b',skin:'#e0b99c',coat:'#b58065',light:'#d3a486',scarf:'#e4d0ac'},suwan:{hair:'#59453d',skin:'#edc6a9',coat:'#dbc5a3',light:'#f0e0c0',scarf:'#b96e67'},merchant:{hair:'#79644a',skin:'#d8b58e',coat:'#89916b',light:'#b2b18a',scarf:'#b89f6d'}};
  Object.assign(palettes,{brother:{hair:'#3e4247',skin:'#d6b88f',coat:'#4f708a',light:'#91adba',scarf:'#d4c5a0'},doctor:{hair:'#4b5043',skin:'#dbbd96',coat:'#476f5d',light:'#a8c2a4',scarf:'#e0ded0'},scribe:{hair:'#91978b',skin:'#c8ac8a',coat:'#716c59',light:'#b7ac8d',scarf:'#d2c4a0'}});
  function draw(c,a,time){
    const p=palettes[a.kind]||palettes.hero,hero=a.kind==='hero',act=a.action,t=act?Math.min(1,act.time/act.duration):0;
    const left=Math.cos(a.angle||0)<-.15,back=Math.sin(a.angle||0)<-.55,face=left?-1:1;
    const walk=a.moving?Math.sin(a.walk||0):0,attack=act?.type==='attack',cast=act?.type==='cast',hurt=act?.type==='hurt';
    const roll=a.dashTime>0?1-a.dashTime/.32:0,kneel=a.pose==='kneel',reach=a.pose==='reach';
    const bob=a.moving?-Math.abs(walk)*2.6:Math.sin(time*2.1)*.8;
    const lean=hurt?-face*6:attack?Math.sin(t*Math.PI)*face*5:0;
    function ellipse(x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);c.fill();}
    function poly(points,col){c.fillStyle=col;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();}
    function stroke(points,col,w){c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
    function arm(side,angle,sword=false){
      c.save();c.translate(side*9,-30);c.rotate(angle);stroke([[0,0],[1,9],[0,17]],p.coat,7);stroke([[0,12],[0,18]],p.skin,5);
      if(sword&&a.weapon!=='none'){stroke([[-6,19],[6,19]],'#c6a365',3);stroke([[0,18],[0,25]],'#62523a',3);poly([[-3,19],[-2,-12],[0,-18],[3,-12],[3,19]],a.sword?'#d3eadc':'#c1d0b8');stroke([[0,16],[0,-12]],'#f1eed1',1);}
      c.restore();
    }
    c.save();c.translate(a.x,a.y);ellipse(0,2,a.dashTime>0?18:15,5.5,'#0c292766');c.scale(1.16,1.16);
    if(a.ghost)c.globalAlpha=.47+.12*Math.sin(time*1.2);
    if(hero&&a.invulnerable>0)c.globalAlpha*=.7+.3*Math.sin(time*14);
    c.translate(lean,bob+(kneel?9:0));
    if(a.dashTime>0){c.translate(0,-19);c.rotate(roll*Math.PI*2*face);c.scale(.94,.85);c.translate(0,19);}
    // Cape and scarf react before the body, keeping their silhouette clear.
    const sway=Math.sin(time*3+(a.walk||0))*(a.moving?5:1.5);
    poly([[-11,-36],[12,-36],[15+sway,-9],[2,-5],[-17+sway*.5,-11]],p.coat);
    poly([[5,-35],[10,-37],[17+sway,-19],[12+sway,-16]],p.scarf);
    const stride=attack?face*4:walk*6;
    stroke([[-6,-14],[-7,-7-stride*.3],[-8+stride*.35,0]],'#344a38',7);
    stroke([[6,-14],[7,-7+stride*.3],[8-stride*.35,0]],'#415440',7);
    stroke([[-10+stride*.35,1],[-5+stride*.35,1]],'#293d31',4);stroke([[5-stride*.35,1],[11-stride*.35,1]],'#293d31',4);
    if(!attack)arm(-face,-walk*.35);
    poly([[-9,-35],[10,-35],[13,-14],[5,-9],[-11,-13]],p.coat);
    poly([[-6,-33],[4,-34],[8,-16],[-5,-15]],p.light);stroke([[-10,-16],[11,-16]],'#5e5940',3);ellipse(1,-16,2.4,2.4,'#d7b976');
    poly([[-11,-36],[0,-30],[12,-36],[12,-31],[3,-25],[-10,-30]],p.scarf);
    // Head, profile and clothing are layered, rather than one static sprite.
    const hx=left?-1.5:1.5,hy=-43;
    ellipse(hx,hy,11,12,p.hair);ellipse(hx+face*2,hy+2,8.8,9.5,p.skin);
    if(back){ellipse(hx,hy-1,10.5,10.5,p.hair);stroke([[-7,-50],[0,-53],[6,-50]],'#88928166',1.5);}
    else{
      poly([[-10,-45],[-9,-52],[-3,-56],[6,-54],[11,-49],[11,-43],[6,-48],[1,-46],[-3,-49],[-8,-43]],p.hair);
      stroke([[-7,-52],[-1,-54],[5,-52]],a.kind==='father'?'#c1c0a2':'#8a796255',1.4);
      ellipse(hx+face*5,-42,1.15,1.5,'#314036');if(Math.abs(Math.sin(a.angle||0))>.35)ellipse(hx-face*2,-42,.9,1.3,'#314036');
      stroke([[hx+face*4,-37],[hx+face*6,-37.4]],'#a27662',1);ellipse(hx+face*5,-39.5,2.3,1,'#c9937933');
      if(a.kind==='father'){poly([[-6,-37],[0,-32],[7,-38],[4,-31],[-2,-29]],'#aaad95');stroke([[-8,-44],[-3,-44]],'#727b65',1.5);}
    }
    if(a.kind==='suwan'){
      poly([[-10,-48],[-13,-37],[-12,-26],[-8,-20],[-5,-23],[-8,-34],[-6,-45]],p.hair);
      for(let i=0;i<4;i++)ellipse(-10+i*.5,-35+i*4,3,3.6,i%2?'#715347':'#5d453d');stroke([[-12,-20],[-7,-20]],'#c18c79',2.5);ellipse(-7,-49,2,1.6,'#e5c68b');ellipse(0,-27,2,3,'#7eb0a7');
    }
    if(a.kind==='mother'){ellipse(-9,-47,5,5,p.hair);stroke([[-12,-49],[-6,-45]],'#d2b57d',2);}
    if(a.kind==='brother'){
      poly([[-11,-49],[-10,-56],[-2,-61],[8,-58],[11,-50]],'#3e617c');
      stroke([[-10,-49],[10,-49]],'#93b0bc',2.3);poly([[face*6,-49],[face*17,-47],[face*12,-44],[face*5,-45]],'#587e94');
      stroke([[-7,-30],[-4,-16]],'#c3b58e',2);ellipse(-5,-15,2,2,'#b7a47c');
    }
    if((a.kind==='doctor'||a.kind==='scribe')&&!back){
      c.strokeStyle=a.kind==='doctor'?'#b7a879':'#696b60';c.lineWidth=1.15;
      for(const gx of [-3.5,4.8]){c.beginPath();c.ellipse(hx+gx,-42,3.5,3,0,0,Math.PI*2);c.stroke();}
      stroke([[hx-.1,-42],[hx+1.3,-42]],'#707862',1);stroke([[hx-8,-43],[hx-6.5,-42]],'#7d846a',1);
    }
    if(a.kind==='doctor'){
      ellipse(-9,-49,4.5,4.5,'#505b48');poly([[-10,-31],[-2,-26],[0,-19],[-7,-23]],'#e4e4d4');poly([[10,-31],[2,-26],[0,-19],[7,-23]],'#e4e4d4');
      stroke([[8,-33],[-10,-13]],'#a1946c',2.5);poly([[-15,-20],[-4,-20],[-3,-8],[-15,-9]],'#8f8059');stroke([[-12,-15],[-7,-15]],'#d7dcbd',1.5);stroke([[-9.5,-17.5],[-9.5,-12.5]],'#d7dcbd',1.5);
    }
    if(hero){
      let armAngle=face*(.5+walk*.16),hasSword=true;
      if(attack){const phase=t<.32?t/.32:t<.72?(t-.32)/.4:1-(t-.72)/.28;
        const swing=t<.32?-1.9-phase*.5:t<.72?-2.4+phase*3.7:1.3*(1-phase);
        armAngle=act.angle+Math.PI/2+(act.combo===2?-swing:swing);}
      if(cast){armAngle=act.angle-Math.PI/2;hasSword=false;}
      if(reach){armAngle=-face*1.1;hasSword=false;}
      if(a.sheathed){armAngle=reach?-face*.85:-walk*.2;hasSword=false;}
      arm(face,armAngle,hasSword);
      if(cast){const ex=Math.cos(act.angle)*25,ey=-28+Math.sin(act.angle)*20,r=4+Math.sin(t*Math.PI)*8;
        const gr=c.createRadialGradient(ex,ey,0,ex,ey,r*3);gr.addColorStop(0,'#d9f5cdaa');gr.addColorStop(1,'transparent');c.fillStyle=gr;c.fillRect(ex-r*3,ey-r*3,r*6,r*6);ellipse(ex,ey,r*.55,r*.55,'#e9f5cd');}
      if(!attack&&!cast){stroke([[-14,-26],[-14,-17]],'#ba9e68',1.5);poly([[-18,-20],[-10,-20],[-9,-11],[-19,-11]],'#a9864e');ellipse(-14,-16,3,4,'#f3d39a');}
    }else{
      arm(face,reach?-face*1.25:walk*.3);
      if(a.kind==='father'){stroke([[17,-44],[17,0]],'#a4966e',2.5);ellipse(17,-45,3,2,'#cfba85');}
      if(a.kind==='suwan'){stroke([[17,-24],[17,-15]],'#c3a16b',1.5);poly([[12,-17],[22,-17],[23,-6],[11,-6]],'#ad8661');ellipse(17,-12,4,4,'#f6d3a2');}
    }
    if(a.kind==='scribe'){
      stroke([[-9,-24],[-13,-18],[-6,-16]],p.skin,4);stroke([[9,-24],[13,-18],[6,-16]],p.skin,4);
      poly([[-15,-24],[-1,-26],[0,-10],[-15,-8]],'#c4b98e');poly([[0,-26],[15,-23],[15,-7],[0,-10]],'#e0d6b4');stroke([[0,-25],[0,-10]],'#8b7e5c',1.5);
      for(let j=0;j<3;j++)stroke([[3,-21+j*4],[11,-19+j*4]],'#9b9272',.8);
    }
    c.restore();
  }
  root.MosslightActors={draw};
})(globalThis);
