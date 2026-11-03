"""Generate long-campaign dialogue, caching each completed line in its manifest.

Install generation dependencies: python -m pip install edge-tts==7.3.1
Node.js must be on PATH or specified by MOSSLIGHT_NODE.
Cached runs require only the Python standard library and Node.js.
"""
from __future__ import annotations

import argparse
import asyncio
import json

from voice_common import (ROOT, JOURNEY_VOICES as VOICES, ManifestCache, atomic_write,
                          journey_fingerprint, source_lines, valid_cached_audio)

SOURCE = 'Microsoft Edge Read Aloud via edge-tts 7.3.1'


async def main(args):
    lines = source_lines('journey')
    if args.probe:
        lines = lines[:1]
    folder = ROOT / 'assets/journey-voice'
    cache = ManifestCache(folder / 'manifest.json', SOURCE)
    semaphore = asyncio.Semaphore(2)

    async def generate(line):
        config = VOICES.get(line['speaker'], VOICES['narrator'])
        fingerprint = journey_fingerprint(line, config)
        path = folder / (line['id'] + '.mp3')
        cached = cache.records.get(line['id'])
        if (not args.force and valid_cached_audio(cached, path, line, 'hash', fingerprint)
                and cached.get('voice') == config[0]):
            return cached
        async with semaphore:
            import edge_tts
            for attempt in range(3):
                try:
                    audio = bytearray()
                    duration = 0

                    async def stream():
                        nonlocal duration
                        communicate = edge_tts.Communicate(line['text'], voice=config[0], rate=config[1],
                                                          pitch=config[2], volume='-8%', proxy=args.proxy)
                        async for chunk in communicate.stream():
                            if chunk['type'] == 'audio':
                                audio.extend(chunk['data'])
                            elif chunk['type'] in ('WordBoundary', 'SentenceBoundary'):
                                duration = max(duration, (chunk['offset'] + chunk['duration']) / 10_000_000)

                    await asyncio.wait_for(stream(), timeout=40)
                    if len(audio) < 1000:
                        raise ValueError('Empty audio')
                    atomic_write(path, bytes(audio))
                    record = {'id': line['id'], 'speaker': line['speaker'], 'voice': config[0],
                              'hash': fingerprint, 'bytes': len(audio), 'durationSeconds': round(duration, 3),
                              'path': 'assets/journey-voice/' + path.name}
                    cache.save(record)
                    print('VOICE', line['id'], len(audio), flush=True)
                    return record
                except Exception as exc:
                    if attempt == 2:
                        print('FAILED', line['id'], str(exc), flush=True)
                        return {'id': line['id'], 'failed': True}
                    await asyncio.sleep(1 + attempt)

    records = await asyncio.gather(*(generate(line) for line in lines))
    failed = sum(bool(record.get('failed')) for record in records)
    if not failed and not args.probe:
        cache.finish(line['id'] for line in lines)
    print(json.dumps({'lines': len(records), 'failed': failed,
                      'bytes': sum(record.get('bytes', 0) for record in records),
                      'seconds': sum(record.get('durationSeconds', 0) for record in records)}), flush=True)
    if failed:
        raise SystemExit(1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--probe', action='store_true')
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--proxy')
    asyncio.run(main(parser.parse_args()))
