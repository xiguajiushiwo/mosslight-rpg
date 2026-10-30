"""Generate only the long campaign's authored dialogue, leaving v2 voices intact."""
from __future__ import annotations
import asyncio, hashlib, json, os, shutil, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.tools/python-deps'))
NODE=os.environ.get('MOSSLIGHT_NODE') or shutil.which('node') or r'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
VOICES={'hero':('zh-CN-YunxiNeural','-4%','-2Hz'),'father':('zh-CN-YunyangNeural','-8%','-8Hz'),'mother':('zh-CN-XiaoxiaoNeural','-8%','-4Hz'),'suwan':('zh-CN-XiaoyiNeural','-4%','+0Hz'),'brother':('zh-CN-YunxiNeural','+2%','+4Hz'),'doctor':('zh-CN-XiaoyiNeural','+0%','-3Hz'),'scribe':('zh-CN-YunyangNeural','-4%','+0Hz'),'narrator':('zh-CN-XiaoxiaoNeural','-5%','-2Hz')}
async def main():
 import edge_tts
 command="const d=require('./src/journey-data.js');let a=[];function walk(x){if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object'){if(x.speaker&&x.text&&x.id)a.push(x);else Object.values(x).forEach(walk)}}walk(d.CHAPTERS);walk(d.SIDEQUESTS);process.stdout.write(JSON.stringify([...new Map(a.map(x=>[x.id,x])).values()]));"
 lines=json.loads(subprocess.run([NODE,'-e',command],cwd=ROOT,capture_output=True,check=True,encoding='utf-8').stdout)
 folder=ROOT/'assets/journey-voice';folder.mkdir(parents=True,exist_ok=True)
 semaphore=asyncio.Semaphore(2)
 async def generate(line):
  config=VOICES.get(line['speaker'],VOICES['narrator']);fingerprint=hashlib.sha256((line['text']+str(config)).encode('utf-8')).hexdigest();file=folder/(line['id']+'.mp3');meta=folder/(line['id']+'.json')
  if file.exists() and meta.exists():
   old=json.loads(meta.read_text(encoding='utf-8'))
   if old.get('hash')==fingerprint and file.stat().st_size>1000:return old
  async with semaphore:
   for attempt in range(3):
    try:
     audio=bytearray();duration=0
     async def stream():
      nonlocal duration
      comm=edge_tts.Communicate(line['text'],voice=config[0],rate=config[1],pitch=config[2],volume='-8%')
      async for chunk in comm.stream():
       if chunk['type']=='audio':audio.extend(chunk['data'])
       elif chunk['type'] in ('WordBoundary','SentenceBoundary'):duration=max(duration,(chunk['offset']+chunk['duration'])/10_000_000)
     await asyncio.wait_for(stream(),40)
     if len(audio)<1000:raise ValueError('Empty audio')
     file.write_bytes(audio);record={'id':line['id'],'speaker':line['speaker'],'voice':config[0],'hash':fingerprint,'bytes':len(audio),'durationSeconds':round(duration,3),'path':'assets/journey-voice/'+file.name}
     meta.write_text(json.dumps(record,ensure_ascii=False),encoding='utf-8');print('VOICE',line['id'],len(audio),flush=True);return record
    except Exception as exc:
     if attempt==2:print('FAILED',line['id'],str(exc),flush=True);return {'id':line['id'],'failed':True}
     await asyncio.sleep(1+attempt)
 records=await asyncio.gather(*(generate(line) for line in lines))
 (folder/'manifest.json').write_text(json.dumps({'source':'Microsoft Edge Read Aloud via edge-tts 7.3.1','lines':records},ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'lines':len(records),'failed':sum(bool(r.get('failed')) for r in records),'bytes':sum(r.get('bytes',0) for r in records),'seconds':sum(r.get('durationSeconds',0) for r in records)}),flush=True)
 if any(r.get('failed') for r in records):sys.exit(1)
if __name__=='__main__':asyncio.run(main())
