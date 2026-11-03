"""Shared, standard-library helpers for dialogue generation and validation."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
STORY_VOICES = {
    'narrator': ('zh-CN-XiaoxiaoNeural', '-10%', '-2Hz'),
    'hero': ('zh-CN-YunxiNeural', '-8%', '-2Hz'),
    'father': ('zh-CN-YunyangNeural', '-12%', '-8Hz'),
    'mother': ('zh-CN-XiaoxiaoNeural', '-12%', '-5Hz'),
    'suwan': ('zh-CN-XiaoyiNeural', '-8%', '+0Hz'),
}
JOURNEY_VOICES = {
    'hero': ('zh-CN-YunxiNeural', '-4%', '-2Hz'),
    'father': ('zh-CN-YunyangNeural', '-8%', '-8Hz'),
    'mother': ('zh-CN-XiaoxiaoNeural', '-8%', '-4Hz'),
    'suwan': ('zh-CN-XiaoyiNeural', '-4%', '+0Hz'),
    'brother': ('zh-CN-YunxiNeural', '+2%', '+4Hz'),
    'doctor': ('zh-CN-XiaoyiNeural', '+0%', '-3Hz'),
    'scribe': ('zh-CN-YunyangNeural', '-4%', '+0Hz'),
    'narrator': ('zh-CN-XiaoxiaoNeural', '-5%', '-2Hz'),
}


def node_executable():
    node = os.environ.get('MOSSLIGHT_NODE') or shutil.which('node')
    if not node:
        raise RuntimeError('Node.js is required. Add node to PATH or set MOSSLIGHT_NODE to its executable.')
    return node


def source_lines(campaign):
    if campaign == 'story':
        command = "process.stdout.write(JSON.stringify(Object.values(require('./src/story.js').SCENES).flatMap(s=>s.lines)))"
    elif campaign == 'journey':
        command = "const d=require('./src/journey-data.js');let a=[];function walk(x){if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object'){if(x.speaker&&x.text&&x.id)a.push(x);else Object.values(x).forEach(walk)}}walk(d.CHAPTERS);walk(d.SIDEQUESTS);process.stdout.write(JSON.stringify(a));"
    else:
        raise ValueError('Unknown campaign: ' + campaign)
    result = subprocess.run([node_executable(), '-e', command], cwd=ROOT,
                            capture_output=True, check=True, encoding='utf-8')
    lines = json.loads(result.stdout)
    ids = [line['id'] for line in lines]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate dialogue IDs in ' + campaign)
    return lines


def story_fingerprint(line):
    return hashlib.sha256(line['text'].encode('utf-8')).hexdigest()


def journey_fingerprint(line, config):
    # Keep the original tuple representation: existing audio caches use it.
    return hashlib.sha256((line['text'] + str(config)).encode('utf-8')).hexdigest()


def atomic_write(path, data):
    """Replace a complete file, retaining the previous version on interrupted writes."""
    path = Path(path)
    if path.exists() and path.read_bytes() == data:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, prefix=path.name + '.', suffix='.tmp', delete=False) as file:
            temporary = Path(file.name)
            file.write(data)
            file.flush()
            os.fsync(file.fileno())
        os.replace(temporary, path)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()


def write_json(path, data):
    path = Path(path)
    text = json.dumps(data, ensure_ascii=False, indent=2)
    if path.exists() and path.read_text(encoding='utf-8') == text:
        return
    atomic_write(path, text.encode('utf-8'))


def manifest_records(path):
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    records = {record['id']: record for record in data['lines']}
    if len(records) != len(data['lines']):
        raise ValueError('Duplicate dialogue IDs in ' + str(path))
    return data, records


class ManifestCache:
    """A single resumable cache, checkpointed after every successful audio file."""

    def __init__(self, path, source):
        self.path = Path(path)
        if self.path.exists():
            self.data, self.records = manifest_records(self.path)
        else:
            self.data, self.records = {'source': source, 'lines': []}, {}

    def save(self, record):
        self.records[record['id']] = record
        self.data['lines'] = list(self.records.values())
        write_json(self.path, self.data)

    def finish(self, ids):
        # Only a completed full run prunes removed source lines. A probe or a
        # failed run preserves all previous entries for the next invocation.
        self.records = {id_: self.records[id_] for id_ in ids}
        self.data['lines'] = list(self.records.values())
        write_json(self.path, self.data)


def valid_cached_audio(record, path, line, fingerprint_key, fingerprint):
    return bool(record and not record.get('failed')
                and record.get('id') == line['id']
                and record.get('speaker') == line['speaker']
                and record.get(fingerprint_key) == fingerprint
                and record.get('path') == path.relative_to(ROOT).as_posix()
                and path.is_file() and path.stat().st_size > 1000
                and path.stat().st_size == record.get('bytes'))


def mp3_frames(data):
    """Check every MPEG Layer III frame without optional audio packages."""
    pos = 0
    if data[:3] == b'ID3':
        if len(data) < 10:
            raise ValueError('Truncated ID3 header')
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
        table = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320] if version == 3 else [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
        bitrate = table[bitrate_index] * 1000
        samplerate = [44100, 48000, 32000][sample_index] // (1 if version == 3 else (2 if version == 2 else 4))
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
