import hashlib
import json
from pathlib import Path

root = Path('.')
kb_path = root / 'pwa/KB/kb.json'
notes_path = root / 'pwa/KB/Techniques/content/Fall Bass Fishing.md'
picture_path = root / 'pwa/KB/Techniques/assets/Fall Bass Fishing.png'

expected_bytes = 2399577
expected_sha256 = '5d79bf15131194655e4a885199da4c067572fea5d3428430787ecf9b80bb2b68'
picture_bytes = picture_path.read_bytes()
assert len(picture_bytes) == expected_bytes, (len(picture_bytes), expected_bytes)
assert hashlib.sha256(picture_bytes).hexdigest() == expected_sha256

data = json.loads(kb_path.read_text(encoding='utf-8'))
assert data.get('schemaVersion') == 2
entities = data['entities']
assert not any(item.get('id') == 'fall-bass-fishing' for item in entities)
assert not any(item.get('content') == 'KB/Techniques/content/Fall Bass Fishing.md' for item in entities)
assert not notes_path.exists()

record = {
    'id': 'fall-bass-fishing',
    'name': 'Fall Bass Fishing ',
    'type': 'technique',
    'description': 'Bass behavior and recommended lures for September, October, and November',
    'content': 'KB/Techniques/content/Fall Bass Fishing.md',
    'picture': {
        'src': 'KB/Techniques/assets/Fall Bass Fishing.png'
    }
}

anchor = next(i for i, item in enumerate(entities) if item.get('id') == 'bass-fishing')
entities.insert(anchor + 1, record)
kb_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

body = (
    '## Where to find fish\n'
    '- In the fall the bass are fattening up on baitfish. They are on the move, and finesse/bottom contact worms and jigs are not as effective as lures that imitate baitfish.\n'
    '- Fish where bait is: up feeder creeks (further up as the season progresses), windblown banks (search Why Wind Matters video), shallow beds near drop-offs to deeper water\n'
    '- Find bait pods with sonar, by looking for their flashes underwater, or where birds are hunting\n'
    ' \n'
    '## Lures\n'
    '- Use crankbaits in shallow water without cover: Bang them off rocks and structure to produce reaction strikes\n'
    '- Use spinner baits and chatter baits in dark or muddy water. The flash and vibration attracts fish and helps them find the bait.\n'
    '- Try jerkbaits and soft swimbaits (flukes)\n'
    '- Topwater baits: Buzzbaits (w/frog trailer), walking baits, poppers, frogs - use these in cover\n'
    ' \n'
    '## By Month\n'
    '- September: \n'
    '  - Shorter days cause baitfish to move to creeks and coves; but warm water means bass have energy and will chase fast-moving baits\n'
    '  - Lures: Topwaters at first light, lipless cranks through grass, spinnerbaits and chatterbaits on windy points. Also square-bill crankbaits around shallow wood and rock with no cover.\n'
    '  - f not getting hits on those, try a fluke or Senko - finicky bass might go for those because they are easy prey\n'
    '- October:\n'
    '  - Bait migrate deeper into the creeks and bass team up to herd and feed on them\n'
    '  - Lures: Spinnerbaits, medium diving crankbaits on the creek beds, jerkbaits. Buzzbaits in the morning and evening, swimbaits around baitfish pods.\n'
    '- November:\n'
    '  - Bass slow down and move to deeper areas: rocky points, creek beds, ledges. \n'
    '  - Lures: Use slower, more deliberate baits. Jerkbaits but with a slower presentation, Ned rigs\n'
    ' \n'
    '## Videos\n'
    '- [Fall Bass Fishing]( https://youtu.be/gQYPsG4F6vs?si=2_vWdMK3FZgc9Aia)\n'
    '- [Fall Bass Fishing for Beginners]( https://www.youtube.com/watch?v=og7TYneLSew)\n'
    '- [Catch Bass in the Fall]( https://youtu.be/jgWabWCAYQE?si=YhxeY_GFCicSPZiO)\n'
    '\n'
)
notes_path.write_text(body, encoding='utf-8')

print('Validated image bytes/SHA-256 and applied Fall Bass Fishing KB package.')
