const test=require('node:test'),assert=require('node:assert/strict'),D=require('../src/journey-data.js');
test('long campaign has eight distinct regions and twelve complete optional stories',()=>{
 assert.equal(D.CHAPTERS.length,8);assert.equal(new Set(D.CHAPTERS.map(c=>c.region)).size,8);assert.equal(D.SIDEQUESTS.length,12);
 for(const [i,c]of D.CHAPTERS.entries()){assert.equal(c.id,i);assert.equal(c.nodes.length,6);assert.ok(c.intro.length&&c.outro.length);assert.ok(c.nodes.some(n=>n.type==='puzzle'));assert.ok(c.nodes.filter(n=>['battle','boss','defend'].includes(n.type)).length>=2);assert.ok(c.nodes.some(n=>n.choices?.length>1));}
 for(const q of D.SIDEQUESTS){assert.equal(q.nodes.length,3);assert.ok(D.CHAPTERS[q.chapter]);}
});
test('every objective and dialogue line has a unique stable identity, bounded location and valid character',()=>{
 const ids=new Set(),lineIds=new Set();let count=0;
 const nodes=[...D.CHAPTERS.flatMap(c=>c.nodes),...D.SIDEQUESTS.flatMap(q=>q.nodes)];
 for(const n of nodes){assert.ok(n.id&&!ids.has(n.id),'duplicate node '+n.id);ids.add(n.id);assert.ok(n.x>70&&n.x<2130&&n.y>70&&n.y<1530,n.id);assert.ok(n.lines.length>=1);if(n.puzzle){assert.ok(n.puzzle.solution.length);for(const a of n.puzzle.solution)assert.ok(Number.isInteger(a)&&a>=0&&a<n.puzzle.labels.length,n.id);}}
 function visit(v){if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object'){if(v.speaker&&v.text){assert.ok(D.CAST[v.speaker],v.speaker);assert.ok(v.id&&!lineIds.has(v.id),'duplicate line '+v.id);lineIds.add(v.id);assert.ok(v.voice?.endsWith(v.id+'.mp3'),v.id);count++;}else Object.values(v).forEach(visit);}}
 visit(D.CHAPTERS);visit(D.SIDEQUESTS);assert.ok(count>=200,'needs authored conversations throughout the campaign');
});
test('recipes and construction use known resources and distinct weapons support different tactics',()=>{
 for(const [id,c]of [...Object.entries(D.RECIPES),...Object.entries(D.BUILDINGS)])for(const [item,n]of Object.entries(c.cost)){assert.ok(D.ITEMS[item],id+' unknown resource '+item);assert.ok(n>0&&Number.isInteger(n));}
 assert.ok(D.WEAPONS.spear.range>D.WEAPONS.sword.range);assert.ok(D.WEAPONS.axe.damage>D.WEAPONS.sword.damage);assert.ok(D.WEAPONS.axe.speed>D.WEAPONS.sword.speed);
});
