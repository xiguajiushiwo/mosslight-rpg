"""Generate the short story's dialogue, caching progress in its manifest.

Install generation dependencies: python -m pip install edge-tts==7.3.1
Run: python tools/generate-voice.py [--probe] [--force] [--proxy URL]
Node.js must be on PATH or specified by MOSSLIGHT_NODE.
Cached runs require only the Python standard library and Node.js.
"""
from __future__ import annotations

import argparse
import asyncio
import json

from voice_common import (ROOT, STORY_VOICES as VOICES, ManifestCache, atomic_write,
                          source_lines, story_fingerprint, valid_cached_audio)

SOURCE = 'Microsoft Edge neural TTS via edge-tts 7.3.1'


def publish_voice_paths(records):
    module = ROOT / 'src/voice.js'
    if module.exists():
        content = module.read_text(encoding='utf-8')
        start = '/* VOICE_FILES_START */'
        end = '/* VOICE_FILES_END */'
        before, rest = content.split(start, 1)
        _, after = rest.split(end, 1)
        paths = {record['id']: record['path'] for record in records}
        updated = before + start + '\n  const VOICE_FILES = ' + json.dumps(paths, ensure_ascii=False, indent=2) + ';\n  ' + end + after
        if updated != content:
            atomic_write(module, updated.encode('utf-8'))


async def main(args):
    lines = source_lines('story')
    if args.probe:
        lines = lines[:1]
    folder = ROOT / 'assets/voice'
    cache = ManifestCache(folder / 'manifest.json', SOURCE)
    semaphore = asyncio.Semaphore(2)

    async def generate(line):
        voice, rate, pitch = VOICES[line['speaker']]
        fingerprint = story_fingerprint(line)
        path = folder / (line['id'] + '.mp3')
        cached = cache.records.get(line['id'])
        if (not args.force and valid_cached_audio(cached, path, line, 'textSha256', fingerprint)
                and (cached.get('voice'), cached.get('rate'), cached.get('pitch')) == (voice, rate, pitch)):
            print('CACHED', line['id'], cached['durationSeconds'], flush=True)
            return cached
        async with semaphore:
            # Loading this optional dependency only after a cache miss keeps
            # offline verification and complete cached runs dependency-free.
            import edge_tts
            communicate = edge_tts.Communicate(line['text'], voice=voice, rate=rate, pitch=pitch,
                                              volume='-8%', proxy=args.proxy, connect_timeout=12, receive_timeout=20)
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
            atomic_write(path, bytes(audio))
            record = {'id': line['id'], 'speaker': line['speaker'], 'path': 'assets/voice/' + path.name,
                      'voice': voice, 'rate': rate, 'pitch': pitch, 'bytes': len(audio),
                      'durationSeconds': round(duration, 3), 'textSha256': fingerprint}
            cache.save(record)
            print('GENERATED', line['id'], len(audio), round(duration, 3), flush=True)
            return record

    records = await asyncio.gather(*(generate(line) for line in lines))
    if not args.probe:
        cache.finish(line['id'] for line in lines)
        publish_voice_paths(records)
    print(json.dumps({'count': len(records), 'bytes': sum(record['bytes'] for record in records),
                      'durationSeconds': round(sum(record['durationSeconds'] for record in records), 2)}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--probe', action='store_true')
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--proxy')
    asyncio.run(main(parser.parse_args()))
