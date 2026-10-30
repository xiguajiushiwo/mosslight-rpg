/* New cast variations share the original painting's lighting and face construction. */
(function(root){'use strict';
function draw(canvas,speaker,base){
 const source={brother:'hero',doctor:'mother',scribe:'father'}[speaker]||base||speaker;
 root.MosslightPortrait.draw(canvas,source);if(!['brother','doctor','scribe'].includes(speaker))return;
 const c=canvas.getContext('2d'),d=canvas.width/240;c.save();c.setTransform(d,0,0,d,0,0);c.lineCap='round';c.lineJoin='round';
 const shape=(path,fill,stroke,width=1)=>{const p=new Path2D(path);if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p);}};
 const ellipse=(x,y,rx,ry,fill,stroke)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.3;c.stroke();}};
 if(speaker==='brother'){
  shape('M44 222 Q65 202 93 198 L122 225 L151 199 Q182 204 202 230 L219 300 L27 300 Z','#416a70','#203e40',1.5);
  shape('M87 190 Q120 205 149 187 L154 204 L126 226 L100 245 L78 210 Z','#9db7b0','#6e8d87');
  shape('M98 228 L124 218 L146 275 L124 284 Z','#719996','#476d69');
  shape('M41 300 L161 213 L174 228 L65 300 Z','#735c40','#403e2b');
  shape('M65 88 Q68 49 109 42 Q151 34 176 70 L168 87 Q121 75 65 91 Z','#375763','#1b3d46',2);
  shape('M63 83 Q126 69 177 82 L170 93 Q119 81 65 94 Z','#6e8b8d','#b9c0a0');
  shape('M126 213 L131 222 L128 232 L121 231 L119 222 Z','#e2c58c','#8e7550');
  shape('M176 246 L192 242 L199 273 L180 278 Z','#a68b5d','#d4bd87');
  shape('M180 250 L190 248 M182 256 L192 254 M184 262 L194 260',null,'#5c624c',1.2);
 }
 if(speaker==='doctor'){
  shape('M45 216 Q66 203 91 195 L120 218 L150 196 Q184 203 202 223 L219 300 L28 300 Z','#758a67','#394f3c',1.5);
  shape('M96 193 L119 216 L144 193 L154 205 L139 300 L107 300 L84 206 Z','#e8dfbc','#b4b08e');
  shape('M107 222 L120 232 L139 218 M123 237 L124 293',null,'#a0a58a',1.3);
  ellipse(103,125,16,11,'#d8ecc30b','#806a47');ellipse(143,124,16,11,'#d8ecc30b','#806a47');
  shape('M119 124 Q124 121 127 124 M87 123 L79 120 M159 122 L166 118',null,'#806a47',1.5);
  shape('M153 61 L174 65 L169 77 L150 71 Z','#a9bba0','#d5d4ac');
  ellipse(166,68,3,3,'#e3cc92');
  shape('M59 240 L89 240 L90 279 L57 279 Z','#5b775b','#a5b493');
  shape('M66 261 Q62 246 76 241 Q80 254 68 263 M68 266 Q76 251 83 251',null,'#b7cc8e',2.1);
  shape('M162 266 L174 266 L174 255 L183 255 L183 266 L195 266 L195 275 L183 275 L183 287 L174 287 L174 275 L162 275 Z','#e2d6ac');
 }
 if(speaker==='scribe'){
  shape('M45 222 Q60 207 92 196 L117 220 L150 195 Q181 205 201 227 L217 300 L29 300 Z','#4a5862','#293c3e',1.4);
  shape('M95 198 L120 220 L143 197 L152 210 L130 248 L101 236 L82 211 Z','#c1b294','#706d5b');
  ellipse(103,126,17,12,null,'#aa956d');ellipse(144,125,17,12,null,'#aa956d');
  shape('M120 125 L127 124 M85 123 L78 119 M162 123 L166 120',null,'#aa956d',1.5);
  shape('M62 300 L70 247 L147 259 L143 300 Z','#cbb98c','#8f835e',1.2);
  shape('M80 258 L135 268 M79 265 L132 275 M78 273 L124 281 M77 280 L131 290',null,'#7a8266',1);
  shape('M166 280 Q154 235 185 213 Q194 242 169 259 L166 286',null,'#d4caa3',2);
  shape('M165 258 Q167 231 185 216 Q189 240 165 258 Z','#b6bfa5','#d3d0b1');
 }
 const fade=c.createLinearGradient(0,265,0,300);fade.addColorStop(0,'#0c252500');fade.addColorStop(1,'#0c2525b0');c.fillStyle=fade;c.fillRect(0,265,240,35);c.restore();
}
root.MosslightJourneyPortrait={draw};
})(globalThis);
