(function(root){
  'use strict';
  class ForestAudio {
    constructor(){this.ctx=null;this.muted=false;this.paused=false;this.voices=0;this.last={};this.beat=0;this.nextBeat=0;this.available=true;try{this.muted=localStorage.getItem('mosslight-muted')==='1';}catch{}}
    async start(){
      if(!this.available)return;
      try{
        if(!this.ctx){
          const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio){this.available=false;return;}
          this.ctx=new Audio();const c=this.ctx;this.master=c.createGain();this.master.gain.value=this.muted?0:.5;
          this.compressor=c.createDynamicsCompressor();this.compressor.threshold.value=-18;this.compressor.knee.value=20;this.compressor.ratio.value=6;this.compressor.attack.value=.006;this.compressor.release.value=.2;
          this.sfx=c.createGain();this.music=c.createGain();this.sfx.gain.value=.7;this.music.gain.value=.34;
          this.sfx.connect(this.master);this.music.connect(this.master);this.master.connect(this.compressor);this.compressor.connect(c.destination);
          this.noise=c.createBuffer(1,c.sampleRate*.5,c.sampleRate);const d=this.noise.getChannelData(0);let seed=2718;
          for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=(seed/4294967296)*2-1;}
          this.nextBeat=c.currentTime+.1;
        }
        if(this.ctx.state==='suspended')await this.ctx.resume();this.paused=false;this.nextBeat=this.ctx.currentTime+.1;
      }catch{this.available=false;}
    }
    tone(freq,duration,gain=.06,type='sine',delay=0,endFreq=null,bus=null){
      if(!this.ctx||this.ctx.state!=='running'||this.voices>=16||this.muted)return;
      const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);
      if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+duration);
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
      o.connect(g);g.connect(bus||this.sfx);o.start(t);o.stop(t+duration+.03);this.voices++;
      o.onended=()=>{o.disconnect();g.disconnect();this.voices=Math.max(0,this.voices-1);};
    }
    swish(duration,gain=.06,cutoff=1200){
      if(!this.ctx||this.ctx.state!=='running'||this.voices>=16||this.muted)return;
      const c=this.ctx,t=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.noise;f.type='lowpass';f.frequency.value=cutoff;
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(gain,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
      s.connect(f);f.connect(g);g.connect(this.sfx);s.start();s.stop(t+duration+.02);this.voices++;
      s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();this.voices=Math.max(0,this.voices-1);};
    }
    play(name){
      if(!this.ctx||this.paused||this.muted)return;const t=this.ctx.currentTime;
      if(t-(this.last[name]??-10)<({hit:.075,pickup:.07,slash:.18}[name]||.1))return;this.last[name]=t;
      const tone=(...a)=>this.tone(...a);
      switch(name){
        case 'slash':this.swish(.13,.08,1300);tone(180,.09,.04,'triangle',0,95);break;
        case 'magic':tone(660,.23,.055,'sine',0,480);tone(990,.18,.03,'sine',.04);break;
        case 'hit':this.swish(.06,.05,850);tone(260,.07,.035,'triangle',0,120);break;
        case 'kill':this.swish(.16,.075,650);tone(160,.18,.06,'sine',0,65);break;
        case 'pickup':tone([660,784,988][this.beat%3],.13,.05);break;
        case 'dash':this.swish(.22,.09,1800);break;
        case 'hurt':tone(130,.26,.14,'sine',0,55);this.swish(.15,.09,400);this.duck();break;
        case 'levelup':[392,523.25,659.25,783.99].forEach((f,i)=>tone(f,.35,.06,'sine',i*.105));break;
        case 'select':tone(523.25,.12,.045);tone(783.99,.14,.025,'sine',.045);break;
        case 'boss':tone(65.4,1,.13,'triangle');tone(98,.9,.08,'sine',.1);this.swish(.45,.06,380);this.duck();break;
        case 'win':[392,523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,.7,.065,'sine',i*.14));this.duck();break;
        case 'lose':tone(329.6,.55,.09);tone(261.6,.8,.08,'sine',.23);this.duck();break;
        case 'interact':tone(440,.15,.05,'triangle');tone(659.25,.22,.04,'sine',.065);break;
        case 'potion':tone(320,.32,.07,'sine',0,640);tone(880,.22,.035,'sine',.12);break;
      }
    }
    duck(){if(!this.ctx)return;const t=this.ctx.currentTime;this.music.gain.cancelScheduledValues(t);this.music.gain.setTargetAtTime(.16,t,.025);this.music.gain.setTargetAtTime(.34,t+.4,.15);}
    update(){
      if(!this.ctx||this.paused||this.ctx.state!=='running')return;
      const now=this.ctx.currentTime;if(now<this.nextBeat)return;
      this.nextBeat=now+.44;const notes=[523.25,0,659.25,783.99,0,659.25,440,0,392,0,523.25,659.25,0,440,392,0];
      const f=notes[this.beat%notes.length];if(f)this.tone(f,.7,.075,'sine',0,null,this.music);
      if(this.beat%4===0)this.tone([130.81,110,98,130.81][Math.floor(this.beat/8)%4],1.4,.07,'triangle',0,null,this.music);
      this.beat++;
    }
    setMuted(value){this.muted=value;try{localStorage.setItem('mosslight-muted',value?'1':'0');}catch{}if(this.ctx)this.master.gain.setTargetAtTime(value?0:.5,this.ctx.currentTime,.02);}
    pause(){this.paused=true;if(this.ctx)this.ctx.suspend().catch(()=>{});}
    resume(){if(this.ctx)this.start();}
  }
  root.ForestAudio=ForestAudio;
})(globalThis);
