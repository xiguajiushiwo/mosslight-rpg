#!/usr/bin/env node
'use strict';

// Rebuild the reader-facing script from the same data the game loads.
// Usage: node tools/export-journey-story.cjs [--check]
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const data = require('../src/journey-data.js');
const target = path.resolve(__dirname, '../design/完整对白.md');
const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八'];
const output = [];
const renderedIds = new Set();
const sourceIds = new Set();
const branchNames = new Map();
const counts = { main: 0, side: 0 };
let section = 'main';

function paragraph(text = '') { output.push(text, ''); }
function heading(level, text) { paragraph('#'.repeat(level) + ' ' + text); }
function walkSource(value) {
  if (Array.isArray(value)) return value.forEach(walkSource);
  if (!value || typeof value !== 'object') return;
  if (typeof value.speaker === 'string' && typeof value.text === 'string') {
    assert.ok(value.id && !sourceIds.has(value.id), 'Missing or duplicated source line identity');
    sourceIds.add(value.id);
  } else Object.values(value).forEach(walkSource);
}
walkSource(data.CHAPTERS);
walkSource(data.SIDEQUESTS);
for (const node of [...data.CHAPTERS.flatMap(c => c.nodes), ...data.SIDEQUESTS.flatMap(q => q.nodes)]) {
  for (const choice of node.choices || []) {
    if (choice.effect?.flag) branchNames.set(choice.effect.flag, `“${node.title}”中选择“${choice.label.replace(/[。！？]+$/, '')}”`);
  }
}

function dialogue(lines) {
  for (const line of lines || []) {
    assert.ok(data.CAST[line.speaker], 'Unknown speaker');
    assert.ok(line.id && !renderedIds.has(line.id), 'Duplicated exported line');
    renderedIds.add(line.id);
    counts[section]++;
    paragraph(`**${data.CAST[line.speaker].name}：** ${line.text}`);
  }
}

function nodeScene(node, index, level = 3) {
  heading(level, `${index + 1}. ${node.title}`);
  paragraph(`场景：${node.description}`);
  dialogue(node.lines);
  if (node.puzzle) {
    paragraph(`**机关线索：** ${node.puzzle.clue}`);
    const solution = node.puzzle.solution.map(n => node.puzzle.labels[n]);
    assert.ok(solution.every(v => typeof v === 'string'), 'Unrenderable puzzle answer');
    paragraph(`**解法（剧透）：** ${node.puzzle.kind === 'rotate' ? '从左到右：' : ''}${solution.join(' → ')}。`);
  }
  if (node.choices?.length) {
    heading(level + 1, '可选择的回应');
    node.choices.forEach((choice, i) => {
      paragraph(`**选择 ${String.fromCharCode(65 + i)}：${choice.label}**`);
      dialogue(choice.result);
    });
  }
  if (node.after?.length) {
    heading(level + 1, '场景结束后');
    dialogue(node.after);
  }
}

heading(1, '《苔灯之森：长夜与归途》开发版 · 完整对白');
paragraph('**含完整剧透。** 本文从当前游戏剧情数据自动导出，收录所有主线、支线和互斥选择的台词。一次游玩不会同时听到所有分支。文中的后日谈属于结局文字，另列于对白之后。');
paragraph('内容范围：8 章、48 个主线场景、12 条支线与 36 个支线场景。本文对应现有开发版，不代表已验证的 10 小时游玩时长。');
paragraph('剧情概览、人物关系和历史时间线见 [完整剧情](完整剧情.md)。');

for (const chapter of data.CHAPTERS) {
  heading(2, `第${chineseNumbers[chapter.id] || chapter.id + 1}章 · ${chapter.title}`);
  paragraph(`地点：${chapter.region}。${chapter.subtitle}`);
  heading(3, '开场');
  dialogue(chapter.intro);
  chapter.nodes.forEach((node, i) => nodeScene(node, i));
  heading(3, '章末');
  dialogue(chapter.outro);
}

section = 'side';
heading(2, '人物支线');
for (const [i, quest] of data.SIDEQUESTS.entries()) {
  heading(3, `${i + 1}. ${quest.title}`);
  paragraph(`发生于第${chineseNumbers[quest.chapter] || quest.chapter + 1}章，${data.CHAPTERS[quest.chapter].region}。${quest.summary}`);
  quest.nodes.forEach((node, j) => nodeScene(node, j, 4));
}

heading(2, '全部结局后日谈');
paragraph('下列文字按玩家此前的选择组合出现；互斥选择不会在同一次结局中同时展示。共有 ' + data.EPILOGUES.length + ' 段，其中最后的共同收束适用于所有结局。');
data.EPILOGUES.forEach((entry, i) => {
  heading(3, `后日谈 ${i + 1}`);
  const conditions = [];
  if (entry.flag) {
    assert.ok(branchNames.has(entry.flag), 'Unmapped epilogue condition');
    conditions.push(branchNames.get(entry.flag));
  }
  if (entry.unless) {
    assert.ok(branchNames.has(entry.unless), 'Unmapped epilogue exclusion');
    conditions.push('未在' + branchNames.get(entry.unless));
  }
  paragraph(conditions.length ? '**出现条件：** ' + conditions.join('；') + '。' : '**共同收束：所有结局。**');
  paragraph(entry.text);
});

assert.deepEqual([...renderedIds].sort(), [...sourceIds].sort(), 'The export omitted or added dialogue lines');
heading(2, '收录核对');
paragraph(`主线 ${counts.main} 句，支线 ${counts.side} 句，共 ${renderedIds.size} 句对白；另含 ${data.EPILOGUES.length} 段结局后日谈。对白计数包含旁白、开场、章末、场景结束台词和每个选项的结果。场景说明、选项文字和机关线索不计为对白。`);
paragraph('本文由 `node tools/export-journey-story.cjs` 从游戏当前数据重建；执行 `node tools/export-journey-story.cjs --check` 可检查文档是否与数据一致。');

const document = output.join('\n').trimEnd() + '\n';
if (process.argv.includes('--check')) {
  assert.equal(fs.readFileSync(target, 'utf8'), document, '完整对白.md is stale; run the exporter again');
} else {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, document, 'utf8');
}
console.log(JSON.stringify({ mode: process.argv.includes('--check') ? 'checked' : 'exported', mainLines: counts.main, sideLines: counts.side, totalLines: renderedIds.size, epilogues: data.EPILOGUES.length, path: target }));
