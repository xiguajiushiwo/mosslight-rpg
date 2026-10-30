/* Original character paintings for 苔灯之森. Drawn entirely with vector paths. */
(function (root) {
  'use strict';
  const WIDTH = 240, HEIGHT = 300;

  function draw(canvas, kind) {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const dpr = Math.min(2, Math.max(1, Number(root.devicePixelRatio) || 1));
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    const c = canvas.getContext('2d');
    if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, WIDTH, HEIGHT);
    c.lineJoin = 'round';
    c.lineCap = 'round';
    const known = ['hero', 'father', 'mother', 'suwan', 'narrator'];
    kind = known.includes(kind) ? kind : 'narrator';

    const path = (d, fill, stroke, line = 1) => {
      const shape = new Path2D(d);
      if (fill) { c.fillStyle = fill; c.fill(shape); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = line; c.stroke(shape); }
    };
    const ellipse = (x, y, rx, ry, fill) => {
      c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      c.fillStyle = fill; c.fill();
    };
    const line = (d, color, width = 1) => path(d, null, color, width);
    const grad = (x1, y1, x2, y2, stops) => {
      const g = c.createLinearGradient(x1, y1, x2, y2);
      stops.forEach(([p, color]) => g.addColorStop(p, color)); return g;
    };
    const glow = (x, y, r, inner, outer = 'rgba(222,211,153,0)') => {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, inner); g.addColorStop(1, outer);
      ellipse(x, y, r, r, g);
    };

    // A quiet painted vignette: characters stay brighter than their surroundings.
    c.fillStyle = grad(0, 0, 230, 300, [[0, '#24413e'], [.5, '#16332f'], [1, '#0c2525']]);
    c.fillRect(0, 0, WIDTH, HEIGHT);
    const memory = kind === 'mother';
    glow(117, 108, 148, memory ? '#72775b' : '#506850');
    glow(195, 40, 88, 'rgba(203,194,133,.14)');
    ellipse(191, 46, 20, 20, 'rgba(226,224,181,.09)');
    line('M16 302 Q33 220 21 130 Q18 80 36 20 M24 156 Q53 125 56 94 M25 199 Q4 171 1 143', '#2c4d40', 3);
    line('M231 300 Q210 219 219 155 Q228 104 220 77 M219 169 Q190 147 188 128 M217 208 Q235 189 240 169', '#294a40', 3);
    [[32,90,-1],[27,122,1],[42,124,1],[16,173,-1],[217,134,1],[210,161,-1],[224,197,1]].forEach(([x,y,side]) => {
      path(`M${x} ${y} Q${x+side*22} ${y-22} ${x+side*18} ${y-37} Q${x-side*4} ${y-24} ${x} ${y}`, '#3b5a44');
    });
    let seed = 319;
    for (let i=0; i<75; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0; const x = seed % WIDTH;
      seed = (seed * 1664525 + 1013904223) >>> 0; const y = seed % HEIGHT;
      ellipse(x, y, .5 + (i%3)*.25, .5 + (i%3)*.25, i%9 ? 'rgba(221,224,180,.08)' : 'rgba(242,201,124,.48)');
    }

    if (kind === 'narrator') {
      glow(119, 170, 95, 'rgba(249,188,90,.29)');
      line('M120 72 C92 70 95 35 119 34 C144 33 148 67 121 75', '#bd9760', 5);
      line('M118 70 C101 66 102 45 118 44', '#e2c491', 1.2);
      path('M87 93 L104 71 L138 71 L155 93 L147 103 L96 103 Z', grad(85,72,153,103,[[0,'#a07e4d'],[.4,'#d8b378'],[1,'#70593b']]), '#4d4732', 2);
      path('M89 102 L153 102 L163 220 L81 220 Z', '#a17a43', '#4f4932', 2);
      path('M98 109 L144 109 L152 211 L90 211 Z', grad(91,110,149,213,[[0,'#d2ae6b'],[.5,'#f7d99b'],[1,'#b77d39']]));
      path('M104 112 L138 112 L142 207 L99 207 Z', '#f8d99a');
      glow(120,165,51,'rgba(255,246,199,.7)');
      path('M121 197 C92 181 115 160 120 141 C124 153 148 175 132 192 Q127 200 121 197', '#fff0ba');
      path('M120 195 C109 185 119 174 122 166 C128 177 134 188 120 195', '#fffde3');
      path('M76 221 L166 221 L160 236 L83 236 Z', grad(80,220,164,238,[[0,'#a27d48'],[.5,'#dcb77b'],[1,'#705435']]), '#4c4630', 2);
      line('M91 105 L83 217 M151 105 L161 217 M119 108 L119 211', '#8d6b3f', 3);
      line('M96 111 L91 165 M137 113 L141 160', 'rgba(255,248,206,.65)', 1.4);
      path('M119 238 C103 252 130 260 113 279 C138 265 127 255 129 240', '#b99b68');
      line('M123 246 Q117 258 121 268', '#ecd2a0', 1.2);
      glow(120,168,64,'rgba(255,215,127,.07)');
      finish(); return canvas;
    }

    const female = kind === 'mother' || kind === 'suwan';
    const old = kind === 'father';
    const face = female ? '#e9bd96' : old ? '#d5aa83' : '#e3b58b';
    const skin = grad(83,91,157,178, [[0,'#f2d0a6'],[.45,face],[1,old?'#b87e61':'#cf9272']]);
    const hair = kind === 'hero' ? '#29312d' : old ? '#514d3e' : kind === 'mother' ? '#62483b' : '#674535';

    // Hair silhouette, separated neck and shoulders preserve the bust at small size.
    if (kind === 'suwan') {
      path('M70 119 C56 81 75 43 109 43 C139 32 173 51 178 90 C186 124 177 143 184 177 L184 249 L154 249 L143 158 L79 163 Z', '#513b30');
      path('M151 92 C182 120 164 149 179 171 C187 184 185 204 173 219 L158 219 C161 185 141 152 147 117 Z', '#684737');
    } else if (kind === 'mother') {
      ellipse(161,77,24,25,'#493d33');
      path('M72 137 C58 110 63 65 89 52 C119 37 151 45 167 68 C180 87 176 121 161 145 L154 166 L80 165 Z', '#564237');
      line('M159 57 Q188 68 169 93 M163 63 Q179 72 168 86', '#87604b', 2);
    } else {
      path(old ? 'M72 131 C63 108 64 72 83 59 C100 43 130 44 148 53 C170 61 179 82 170 119 L160 149 L81 149 Z' : 'M71 130 C58 105 65 78 73 70 L67 59 L91 60 C107 35 146 43 159 56 L174 58 L168 77 C183 96 171 125 163 141 Z', hair);
    }

    path('M99 163 L100 201 Q119 222 145 200 L141 163 Z', grad(99,166,141,208,[[0,'#b67e61'],[.45,face],[1,'#e4b993']]));
    line('M103 182 Q122 191 140 180', 'rgba(123,76,58,.25)', 1);

    if (kind === 'hero') {
      path('M91 195 Q62 194 43 216 L27 300 L219 300 L203 224 Q184 198 150 195 Z', grad(39,203,202,299,[[0,'#71805a'],[.5,'#4f6349'],[1,'#304d3e']]), '#263d32', 1.5);
      path('M52 218 L69 232 L61 300 L31 300 Z','#526647');
      path('M153 199 L183 214 L198 300 L165 300 Z','#3c5140');
      path('M93 183 L75 199 Q85 221 116 233 L151 214 L148 190 Q119 211 93 183', grad(86,187,142,232,[[0,'#f0e3bd'],[.5,'#d9cc9f'],[1,'#b7a77f']]), '#a59671', 1);
      path('M119 225 L99 241 L114 279 L145 263 L138 221 Z','#d7c69e');
      line('M86 200 Q105 217 133 211 M101 235 L118 263 M117 235 L132 256', '#a99874', 1.1);
      path('M60 300 L161 207 L174 219 L82 300 Z', '#68523b', '#3c3f31', 1);
      line('M65 300 L165 212', '#b09564', 1.4);
      ellipse(148,218,9,11,'#6a5737');
      ellipse(147,216,7,8,grad(142,209,154,225,[[0,'#ffe0a0'],[.5,'#d6a455'],[1,'#8d6334']]));
      path('M147 210 L151 216 L147 221 L143 216 Z','#f7d995');
      line('M184 243 L191 288 M48 248 L43 282', '#80906b', 1.1);
    } else if (old) {
      path('M94 194 Q59 191 42 222 L29 300 L216 300 L202 225 Q182 196 149 193 Z', grad(43,206,203,300,[[0,'#887251'],[.45,'#685b42'],[1,'#3d4638']]), '#394031', 1.5);
      path('M100 188 L122 206 L145 188 L159 207 L143 300 L104 300 L83 207 Z', '#b2a47e');
      path('M96 194 L118 213 L105 236 L81 207 Z','#73674c');
      path('M149 193 L123 213 L140 238 L167 207 Z','#a28c64');
      path('M66 248 L93 248 L94 277 L65 277 Z', '#78664a','#a18a63',1);
      line('M68 252 L90 252 M71 278 L71 286 M190 252 L194 283', '#aa9168', 1);
      path('M172 263 L190 260 L193 281 L175 282 Z','#887556');
      line('M174 266 L191 279 M190 263 L176 280', '#b5a47a', .8);
      [233,259,285].forEach(y=>{ellipse(123,y,3.5,3.5,'#4c4536');ellipse(122,y-1,1.2,1.2,'#c0a475');});
    } else if (kind === 'mother') {
      path('M93 190 Q60 192 43 219 L28 300 L216 300 L202 221 Q179 192 145 190 Z', grad(50,202,190,290,[[0,'#eee0bd'],[.5,'#d2c49e'],[1,'#a69a78']]), '#897d5d',1);
      path('M98 185 L120 201 L145 185 L151 201 L123 217 L90 201 Z','#f5e6c1');
      path('M47 215 Q77 232 91 245 L127 300 L28 300 Z','#a97157');
      path('M191 211 Q166 236 145 251 L107 300 L218 300 L208 239 Z',grad(154,217,201,300,[[0,'#b98062'],[1,'#825b49']]));
      line('M47 224 Q76 242 114 299 M190 224 Q153 258 127 299', '#d4a17b',2);
      line('M51 236 Q76 259 87 285 M196 241 Q180 267 170 291', '#c18e6c',1);
      path('M116 210 L123 218 L119 240',null,'#ac9870',1);
      ellipse(120,224,3,3,'#b49b68');
      line('M66 245 L56 280 M178 255 L187 287', '#88634f',1);
    } else {
      path('M91 192 Q63 198 44 221 L28 300 L218 300 L202 226 Q176 197 148 190 Z',grad(52,218,193,300,[[0,'#f1e2bd'],[.55,'#d9cda7'],[1,'#b1a684']]),'#7e795e',1);
      path('M94 187 L121 204 L147 186 L158 202 L124 231 L84 204 Z','#f4e7c8');
      path('M46 217 Q80 234 116 247 Q159 232 177 202 L199 218 Q178 265 128 283 L96 300 L30 300 Z', grad(48,218,170,300,[[0,'#c88972'],[.45,'#ad685b'],[1,'#814e48']]),'#84544a',1);
      path('M184 212 Q181 247 199 299 L219 300 L209 237 Z','#b67560');
      line('M48 227 Q79 245 116 259 Q160 244 181 215 M43 238 Q79 256 111 268', '#e2a183',1.5);
      line('M54 273 L48 286 M66 278 L61 291 M79 282 L73 296 M92 285 L86 300', '#e6ad86',1);
      line('M103 195 Q107 218 125 229 Q144 215 143 195','#c9ae72',1.4);
      path('M125 221 Q134 228 129 237 Q124 242 119 234 Q116 228 125 221', '#bc9b61');
      path('M125 225 Q131 230 126 235 Q122 236 121 231 Z','#5d9e99');
      ellipse(124,228,1.2,1.8,'#d0e4cb');
    }

    // Ears and face are painted over the neck, under all foreground hair.
    ellipse(79,131,8,13, '#c18b6e'); ellipse(163,131,8,13, '#c18b6e');
    line('M77 127 Q85 126 80 138 M164 126 Q157 130 163 138','#a8745c',1.2);
    const head = female
      ? 'M81 99 C82 75 105 64 127 68 C152 71 166 91 163 118 L159 147 Q151 173 124 184 Q97 177 86 152 Z'
      : old
        ? 'M80 100 C83 75 105 66 129 69 C155 70 168 91 163 119 L159 153 Q145 180 123 185 Q99 180 84 155 Z'
        : 'M81 101 C83 76 107 65 129 70 C153 72 167 91 161 122 L157 151 Q144 176 122 182 Q99 174 86 151 Z';
    path(head,skin,'#b58163',.7);
    path('M151 99 Q167 113 157 149 Q145 171 124 181 L128 169 Q145 155 146 132 Z','rgba(141,86,61,.16)');
    path('M89 118 Q88 143 99 156 Q96 138 103 126 Z','rgba(255,223,177,.3)');
    glow(99,147,15, female?'rgba(202,105,92,.19)':'rgba(187,105,78,.12)','rgba(202,105,92,0)');
    glow(147,145,13,'rgba(202,105,92,.12)','rgba(202,105,92,0)');

    // Eyes: dark upper lids, warm irises and a single reflected point of light.
    const eyeY=old?128:126;
    const eye=(x,y,w,tilt)=>{
      path(`M${x-w} ${y} Q${x} ${y-5+tilt} ${x+w} ${y-1} Q${x+2} ${y+5} ${x-w} ${y}`, '#eee0bf');
      ellipse(x+1,y,3.8,4.3,kind==='suwan'?'#6c6f4b':'#645744');
      ellipse(x+1,y+.1,2.3,3,'#303b31');
      ellipse(x-.1,y-1.6,1.1,1.1,'#fff2cc');
      line(`M${x-w-1} ${y} Q${x-1} ${y-5+tilt} ${x+w+1} ${y-1}`,'#5c4939',female?1.6:1.7);
      line(`M${x-w+3} ${y+5} Q${x} ${y+7} ${x+w-2} ${y+3}`,'rgba(153,96,73,.38)',.8);
    };
    eye(102,eyeY,9,old?1:0); eye(143,eyeY-1,8.5,0);
    const brow = old?'#67604c':hair;
    line(old?'M91 118 Q101 113 111 118':'M91 116 Q101 111 111 115',brow,old?2:2.6);
    line('M134 114 Q145 110 153 115',brow,old?2:2.4);
    line('M124 125 Q121 135 122 143 Q126 147 130 143','#b98162',1.2);
    line('M117 145 Q120 147 122 145 M129 145 L132 144','rgba(133,84,63,.6)',.9);
    line('M125 129 L126 138','rgba(255,225,179,.55)',1.2);
    const mouth = kind==='mother'?'M109 159 Q121 165 136 157':old?'M108 160 Q120 164 135 158':'M111 158 Q122 161 135 156';
    line(mouth,old?'#8c6450':'#a56856',1.5);
    line('M117 165 Q124 168 131 163','rgba(255,214,170,.7)',1.1);
    if (old) {
      line('M87 130 L82 133 M89 134 L85 138 M153 130 L159 133 M152 135 L156 138','#ae795e',.9);
      line('M96 101 Q115 96 139 100 M99 106 Q117 102 136 105','rgba(130,92,68,.24)',.8);
      path('M87 147 Q92 169 122 183 Q148 174 158 151 L150 162 Q136 171 124 172 Q106 171 96 161 Z','rgba(105,97,77,.24)');
      for(let i=0;i<13;i++){
        const x=96+i*4.3,y=168+Math.sin(i/12*Math.PI)*8;
        line(`M${x} ${y} l1.2 3`,'rgba(87,79,64,.35)',.8);
      }
      line('M109 155 Q116 151 122 154 M124 154 Q133 151 138 153','#7b7057',1.3);
    }

    // Hair is built from large locks, then a handful of lit strands.
    if (kind==='hero') {
      path('M74 120 Q66 95 77 74 Q87 58 113 57 Q147 49 164 76 L168 105 L158 121 L153 89 Q143 101 129 106 L137 84 Q116 105 99 110 L105 86 Q91 105 82 108 L83 126 Z',hair);
      path('M78 80 Q94 61 117 62 Q140 56 156 75 Q135 64 119 76 Q100 79 88 98 Z','#3b4237');
      line('M90 79 Q105 67 125 69 M112 83 Q132 62 150 76 M140 82 L133 98','#5c5e45',1.3);
      line('M80 99 L79 114 M159 91 L163 109','#53604a',1);
    } else if (old) {
      path('M73 122 Q64 86 85 66 Q105 49 137 57 Q162 58 168 84 L164 119 L158 116 L156 86 Q142 92 132 79 Q112 91 91 82 L84 117 L81 129 Z',hair);
      path('M73 93 Q74 80 85 72 L91 81 L83 122 L78 126 Z','#a3a087');
      path('M156 80 Q166 86 166 101 L161 124 L157 115 Z','#b2ac8e');
      line('M86 72 Q110 57 135 65 M99 73 Q118 62 146 74','#8a866f',1.6);
      line('M77 94 L81 84 M77 103 L81 92 M161 96 L162 111','#d1c6a2',1);
      line('M87 143 L88 152 M156 142 L154 151','#8d8268',1.7);
    } else if (kind==='mother') {
      path('M74 123 Q65 95 82 72 Q102 49 129 57 Q158 59 169 87 L163 125 L157 112 L151 84 Q136 93 116 88 Q102 87 96 96 L83 113 L81 129 Z',hair);
      path('M80 91 Q88 62 119 62 Q139 61 151 75 Q128 68 110 78 Z','#7c5742');
      line('M83 96 Q95 71 120 68 M103 81 Q124 71 143 77 M156 86 Q166 101 161 117','#a87b57',1.25);
      line('M77 119 Q70 139 82 149 M163 120 Q174 140 160 151','#77503d',1.5);
      path('M148 72 L169 62 L172 67 L151 77 Z','#cdb27c');
      ellipse(168,65,4,4,'#ddd1a4');
      ellipse(82,144,2.2,3.3,'#d5b47d');ellipse(162,144,2.2,3.3,'#d5b47d');
    } else {
      path('M72 124 Q61 90 79 66 Q98 44 125 50 Q157 44 170 73 Q179 94 167 126 L160 130 L157 96 Q146 90 139 76 Q119 99 90 103 L82 125 Z',hair);
      path('M77 92 Q83 65 109 59 Q129 53 139 62 Q116 68 102 87 Z','#865d43');
      line('M83 88 Q100 65 127 61 M89 96 Q116 87 135 69 M146 70 Q164 83 165 108','#af7b52',1.2);
      line('M73 115 Q67 132 79 148 M164 117 Q175 129 168 143','#83553d',1.5);
      // Alternating locks create a real side braid with a lit central seam.
      for(let i=0;i<7;i++) {
        const x=166+i*1.0, y=151+i*15.0, w=13-i*.6;
        path(`M${x} ${y-7} Q${x-w-8} ${y-4} ${x-w+1} ${y+9} Q${x+1} ${y+17} ${x+9} ${y+6} Q${x+14} ${y-5} ${x} ${y-7}`, i%2?'#77503a':'#684632','#4f392e',.7);
        line(`M${x-w+2} ${y} Q${x-2} ${y+2} ${x+4} ${y+9}`,'#aa7650',1.3);
      }
      path('M167 255 L181 252 L182 259 L167 262 Z','#c59174');
      path('M174 260 Q163 276 172 282 L177 272 L184 282 Q185 266 179 258 Z','#6a4934');
      line('M174 263 L174 276','#ae7951',1);
      ellipse(80,144,2.5,4,'#c9ab71');
      ellipse(80,149,2,3,'#74a59a');
    }
    if (memory) {
      glow(64,117,63,'rgba(246,227,174,.09)');
      line('M77 80 Q57 135 88 177','rgba(240,225,181,.23)',1.5);
    }
    finish();

    function finish() {
      const fade = grad(0,249,0,300,[[0,'rgba(12,37,37,0)'],[1,'rgba(12,37,37,.6)']]);
      c.fillStyle=fade;c.fillRect(0,245,WIDTH,55);
      line('M14 36 L14 14 L36 14 M204 14 L226 14 L226 36 M14 264 L14 286 L36 286 M204 286 L226 286 L226 264','rgba(212,206,160,.24)',1);
      c.setTransform(1,0,0,1,0,0);
    }
    return canvas;
  }

  root.MosslightPortrait = { draw };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MosslightPortrait;
})(globalThis);
