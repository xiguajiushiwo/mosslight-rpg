"""Generate MOSSLIGHT's authored story dialogue. Requires project-local edge-tts.

Install: python -m pip install --target .tools/python-deps edge-tts
Run: python tools/generate-voice.py --probe
     python tools/generate-voice.py
Use --proxy URL only when an explicitly configured network proxy is required.
"""
from __future__ import annotations
import argparse
import asyncio
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools/python-deps'))
NODE = Path(os.environ.get('MOSSLIGHT_NODE') or shutil.which('node') or r'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')
VOICES = {
    'narrator': ('zh-CN-XiaoxiaoNeural', '-10%', '-2Hz'),
    'hero': ('zh-CN-YunxiNeural', '-8%', '-2Hz'),
    'father': ('zh-CN-YunyangNeural', '-12%', '-8Hz'),
    'mother': ('zh-CN-XiaoxiaoNeural', '-12%', '-5Hz'),
    'suwan': ('zh-CN-XiaoyiNeural', '-8%', '+0Hz'),
}


def lines_from_source():
    command = "const s=require('./src/story.js'); process.stdout.write(JSON.stringify(Object.values(s.SCENES).flatMap(s=>s.lines)))"
    result = subprocess.run([str(NODE), '-e', command], cwd=ROOT, capture_output=True, check=True, encoding='utf-8')
    lines = json.loads(result.stdout)
    out = ROOT / 'production/audio/story'
    out.mkdir(parents=True, exist_ok=True)
    (out / 'script.json').write_text(json.dumps(lines, ensure_ascii=False, indent=2), encoding='utf-8')
    return lines


def publish_manifest(records, source):
    target = ROOT / 'assets/voice/manifest.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    data = {'source': source, 'lines': records}
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    module = ROOT / 'src/voice.js'
    if module.exists():
        content = module.read_text(encoding='utf-8')
        start = '/* VOICE_FILES_START */'
        end = '/* VOICE_FILES_END */'
        before, rest = content.split(start, 1)
        _, after = rest.split(end, 1)
        paths = {r['id']: r['path'] for r in records}
        content = before + start + '\n  const VOICE_FILES = ' + json.dumps(paths, ensure_ascii=False, indent=2) + ';\n  ' + end + after
        module.write_text(content, encoding='utf-8')


async def main(args):
    import edge_tts
    lines = lines_from_source()
    if args.probe:
        lines = lines[:1]
    folder = ROOT / 'assets/voice'
    folder.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(2)
    async def generate(line):
        voice, rate, pitch = VOICES[line['speaker']]
        fingerprint = hashlib.sha256(line['text'].encode('utf-8')).hexdigest()
        path = folder / (line['id'] + '.mp3')
        timing = folder / (line['id'] + '.timing.json')
        if not args.force and path.exists() and path.stat().st_size > 1000 and timing.exists():
            cached = json.loads(timing.read_text(encoding='utf-8'))
            if cached.get('textSha256') == fingerprint and (cached.get('voice'), cached.get('rate'), cached.get('pitch')) == (voice, rate, pitch):
                print('CACHED', line['id'], cached['durationSeconds'], flush=True)
                return cached
        async with semaphore:
            communicate = edge_tts.Communicate(line['text'], voice=voice, rate=rate, pitch=pitch, volume='-8%', proxy=args.proxy, connect_timeout=12, receive_timeout=20)
            audio = bytearray()
            duration = 0
            async def stream():
                nonlocal duration
                async for chunk in communicate.stream():
                    if chunk['type'] == 'audio':
                        audio.extend(chunk['data'])
                    elif chunk['type'] in ('WordBoundary', 'SentenceBoundary'):
                        duration = max(duration, (chunk['offset'] + chunk['duration']) / 10_000_000)
            await asyncio.wait_for(stream(), timeout=40)
            if len(audio) < 1000:
                raise RuntimeError('No usable audio for ' + line['id'])
            path.write_bytes(audio)
            record = {'id': line['id'], 'speaker': line['speaker'], 'path': 'assets/voice/' + path.name,
                      'voice': voice, 'rate': rate, 'pitch': pitch, 'bytes': len(audio), 'durationSeconds': round(duration, 3), 'textSha256': fingerprint}
            timing.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
            print('GENERATED', line['id'], len(audio), round(duration, 3), flush=True)
            return record
    records = await asyncio.gather(*(generate(line) for line in lines))
    if not args.probe:
        publish_manifest(records, 'Microsoft Edge neural TTS via edge-tts 7.3.1')
    print(json.dumps({'count': len(records), 'bytes': sum(r['bytes'] for r in records), 'durationSeconds': round(sum(r['durationSeconds'] for r in records), 2)}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--probe', action='store_true')
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--proxy')
    asyncio.run(main(parser.parse_args()))
