// Renders the actual game actor renderer for visual QA, without a browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const runtime=process.env.MOSSLIGHT_NODE_MODULES||'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas}=require(path.join(runtime,'@napi-rs/canvas'));
const {Game}=require('../src/core.js');vm.runInThisContext(fs.readFileSync(path.resolve(__dirname,'../src/actors.js'),'utf8'));
const out=path.resolve(__dirname,'../production/qa/action-frames');fs.mkdirSync(out,{recursive:true});
const games=Array.from({length:4},()=>{const g=new Game();g.enemies.forEach(e=>e.alive=false);g.player.angle=0;return g;});
for(let frame=0;frame<48;frame++){
  const t=frame/20,canvas=createCanvas(960,260),c=canvas.getContext('2d');c.fillStyle='#132e26';c.fillRect(0,0,960,260);
  ['行走 · 重心与摆臂','三式连击 · 起手与收招','施法 · 蓄力与释放','翻滚 · 动作取消'].forEach((label,i)=>{
    const g=games[i];g.player.mp=g.player.maxMp;if(i===3&&frame%32===0)g.dash(1,0);g.step(.05,{attack:i===1,magic:i===2});
    c.save();c.translate(i*240,0);c.fillStyle=i%2?'#1a382c':'#18352b';c.fillRect(7,8,226,244);c.fillStyle='#7a997255';c.beginPath();c.ellipse(120,197,72,20,0,0,Math.PI*2);c.fill();
    c.save();c.translate(120,195);c.scale(2.1,2.1);
    const a=g.player;MosslightActors.draw(c,{x:0,y:0,kind:'hero',angle:i===0?.3:0,walk:t*10,moving:i===0,action:a.action,dashTime:a.dashTime,invulnerable:0,sword:true},t);c.restore();
    c.fillStyle='#dfd5af';c.textAlign='center';c.font='13px "Microsoft YaHei"';c.fillText(label,120,31);c.fillStyle='#a5b99c';c.font='11px "Microsoft YaHei"';c.fillText(['W A S D','J / 空格','K','Shift'][i],120,232);c.restore();
  });
  fs.writeFileSync(path.join(out,String(frame).padStart(3,'0')+'.png'),canvas.toBuffer('image/png'));
}
console.log(out);
