"""Validate long-campaign audio using Python's standard library and Node.js."""
import json

from voice_common import (ROOT, JOURNEY_VOICES, journey_fingerprint, manifest_records,
                          mp3_frames, source_lines, valid_cached_audio, write_json)


def main():
    lines = source_lines('journey')
    _, records = manifest_records(ROOT / 'assets/journey-voice/manifest.json')
    assert set(records) == {line['id'] for line in lines}, 'Dialogue IDs do not match the manifest'
    validated = []
    for line in lines:
        record = records[line['id']]
        config = JOURNEY_VOICES.get(line['speaker'], JOURNEY_VOICES['narrator'])
        path = ROOT / 'assets/journey-voice' / (line['id'] + '.mp3')
        assert valid_cached_audio(record, path, line, 'hash', journey_fingerprint(line, config)), 'Missing, changed or stale audio: ' + line['id']
        assert record.get('voice') == config[0], 'Stale voice configuration: ' + line['id']
        audio = path.read_bytes()
        metadata = mp3_frames(audio)
        assert 0.4 < metadata['durationSeconds'] < 90, 'Unexpected duration: ' + line['id']
        validated.append({'id': line['id'], 'bytes': len(audio), **metadata})
    output = {'lineCount': len(validated), 'totalBytes': sum(record['bytes'] for record in validated),
              'totalDurationSeconds': round(sum(record['durationSeconds'] for record in validated), 3), 'files': validated}
    write_json(ROOT / 'production/audio/journey/validation.json', output)
    print(json.dumps({key: value for key, value in output.items() if key != 'files'}, indent=2))


if __name__ == '__main__':
    main()
