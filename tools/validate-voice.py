"""Validate every dialogue MP3 using standard-library MPEG frame parsing."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
NODE = Path(os.environ.get('MOSSLIGHT_NODE') or shutil.which('node') or r'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')


def mp3_frames(data):
    pos = 0
    if data[:3] == b'ID3':
        pos = 10 + sum((data[6 + i] & 127) << (21 - i * 7) for i in range(4))
    duration = 0
    frames = 0
    rates = set()
    while pos + 4 <= len(data):
        header = int.from_bytes(data[pos:pos + 4], 'big')
        if header >> 21 != 0x7ff:
            raise ValueError('Invalid MP3 sync at byte ' + str(pos))
        version = (header >> 19) & 3
        layer = (header >> 17) & 3
        bitrate_index = (header >> 12) & 15
        sample_index = (header >> 10) & 3
        padding = (header >> 9) & 1
        if version == 1 or layer != 1 or bitrate_index in (0, 15) or sample_index == 3:
            raise ValueError('Unsupported MPEG Layer III header at byte ' + str(pos))
        table = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320] if version == 3 else [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160]
        bitrate = table[bitrate_index] * 1000
        samplerate = [44100,48000,32000][sample_index] // (1 if version == 3 else (2 if version == 2 else 4))
        length = (144 if version == 3 else 72) * bitrate // samplerate + padding
        if pos + length > len(data):
            raise ValueError('Truncated MP3 frame at byte ' + str(pos))
        duration += (1152 if version == 3 else 576) / samplerate
        rates.add(samplerate)
        frames += 1
        pos += length
    if pos != len(data) or frames == 0:
        raise ValueError('Trailing bytes or empty MP3')
    return {'frames': frames, 'durationSeconds': round(duration, 3), 'sampleRates': sorted(rates)}


command = "process.stdout.write(JSON.stringify(Object.values(require('./src/story.js').SCENES).flatMap(s=>s.lines)))"
result = subprocess.run([str(NODE), '-e', command], cwd=ROOT, check=True, capture_output=True, encoding='utf-8')
lines = json.loads(result.stdout)
manifest = json.loads((ROOT / 'assets/voice/manifest.json').read_text(encoding='utf-8'))
records = {record['id']: record for record in manifest['lines']}
assert len(records) == len(lines), 'Line count mismatch'
validated = []
for line in lines:
    record = records[line['id']]
    assert record['textSha256'] == hashlib.sha256(line['text'].encode('utf-8')).hexdigest(), 'Stale dialogue audio: ' + line['id']
    path = ROOT / record['path']
    audio = path.read_bytes()
    assert len(audio) == record['bytes'] and len(audio) > 1000, 'Empty or changed file: ' + line['id']
    metadata = mp3_frames(audio)
    assert 0.5 < metadata['durationSeconds'] < 60, 'Unexpected duration: ' + line['id']
    validated.append({'id': line['id'], 'bytes': len(audio), **metadata})
output = {'lineCount': len(validated), 'totalBytes': sum(r['bytes'] for r in validated),
          'totalDurationSeconds': round(sum(r['durationSeconds'] for r in validated), 3), 'files': validated}
(ROOT / 'production/audio/story/validation.json').write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({key:value for key,value in output.items() if key != 'files'}, indent=2))
