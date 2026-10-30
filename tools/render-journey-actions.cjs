// Visual QA using the same campaign and actor renderer as journey.html.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const runtime=process.env.MOSSLIGHT_NODE_MODULES||'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas}=require(path.join(runtime,'@napi-rs/canvas'));
const {Campaign}=require('../src/journey-core.js');
const {Renderer}=require('../src/journey-render.js');
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname,'../src/actors.js'),'utf8'));
const out=path.resolve(__dirname,'../production/qa/journey-action-frames');fs.mkdirSync(out,{recursive:true});
const games=['sword','spear','axe','sword','sword'].map(weapon=>{const g=new Campaign();g.enemies=[];g.player.weapon=weapon;g.player.angle=0;return g;});
const labels=['短剑 · 连击','长矛 · 突刺','重斧 · 破甲','举盾 · 方向格挡','翻滚 · 闪避'];
for(let frame=0;frame<60;frame++){
  const canvas=createCanvas(1100,280),c=canvas.getContext('2d'),renderer=new Renderer(canvas),time=frame/20;
  c.fillStyle='#132e26';c.fillRect(0,0,1100,280);
  games.forEach((g,i)=>{
    g.player.stamina=g.player.maxStamina;
    if(i===4&&frame%24===0)g.dash(1,0);
    g.step(.05,{attack:i<3,block:i===3&&frame%30<23});
    c.save();c.translate(i*220,0);c.fillStyle=i%2?'#1a382c':'#18352b';c.fillRect(6,8,208,264);
    c.fillStyle='#dfd5af';c.textAlign='center';c.font='16px "Microsoft YaHei"';c.fillText(labels[i],110,38);
    c.save();c.translate(i===1?76:110,205);c.scale(i===1?1.55:1.9,i===1?1.55:1.9);renderer.time=time;
    renderer.drawActor({...g.player,x:0,y:0,kind:'hero'},g);c.restore();
    c.fillStyle='#a5b99c';c.font='12px "Microsoft YaHei"';c.fillText(['J · R 切换武器','J · R 切换武器','J · R 切换武器','按住空格','Shift'][i],110,250);c.restore();
  });
  fs.writeFileSync(path.join(out,String(frame).padStart(3,'0')+'.png'),canvas.toBuffer('image/png'));
}
console.log(out);
