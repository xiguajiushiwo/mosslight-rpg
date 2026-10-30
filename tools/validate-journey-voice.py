"""Verify long-campaign text fingerprints and all complete MPEG audio frames."""
import ast, hashlib, json, subprocess
from pathlib import Path
import importlib.util
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('journey_voice_generation',ROOT/'tools/generate-journey-voice.py')
generation=importlib.util.module_from_spec(spec);spec.loader.exec_module(generation)
# Reuse the existing pure parser without running its v2-specific validation script.
tree=ast.parse((ROOT/'tools/validate-voice.py').read_text(encoding='utf-8'))
parser_node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='mp3_frames')
namespace={};exec(compile(ast.Module(body=[parser_node],type_ignores=[]),'mp3_frames','exec'),namespace)
command="const d=require('./src/journey-data.js');let a=[];function walk(x){if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object'){if(x.speaker&&x.text&&x.id)a.push(x);else Object.values(x).forEach(walk)}}walk(d.CHAPTERS);walk(d.SIDEQUESTS);process.stdout.write(JSON.stringify(a));"
lines=json.loads(subprocess.run([generation.NODE,'-e',command],cwd=ROOT,capture_output=True,encoding='utf-8',check=True).stdout)
manifest=json.loads((ROOT/'assets/journey-voice/manifest.json').read_text(encoding='utf-8'))
records={r['id']:r for r in manifest['lines']};assert len(records)==len(lines)
validated=[]
for line in lines:
 record=records[line['id']];assert not record.get('failed'),line['id']
 config=generation.VOICES.get(line['speaker'],generation.VOICES['narrator'])
 expected=hashlib.sha256((line['text']+str(config)).encode('utf-8')).hexdigest()
 assert record['hash']==expected,'Stale text '+line['id']
 data=(ROOT/record['path']).read_bytes();assert len(data)==record['bytes'] and len(data)>1000
 metadata=namespace['mp3_frames'](data);assert .4<metadata['durationSeconds']<90
 validated.append({'id':line['id'],'bytes':len(data),**metadata})
out={'lineCount':len(validated),'totalBytes':sum(v['bytes'] for v in validated),'totalDurationSeconds':round(sum(v['durationSeconds'] for v in validated),3),'files':validated}
folder=ROOT/'production/audio/journey';folder.mkdir(parents=True,exist_ok=True)
(folder/'validation.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in out.items() if k!='files'},indent=2))
