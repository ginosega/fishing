#!/usr/bin/env python3
"""Reproduce the approved v2 migration from pinned Actions artifacts.

The source and media are immutable inputs. This program never discovers,
downloads, converts, or silently substitutes images.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess
import sys
import unicodedata
import zipfile

AUDIT_SHA = 'ff909f020af9460b8d745a4bed5c46bccd199f695ac84626a8cd8cca65f5d0cb'
SOURCE_ZIP_SHA = 'dc9ba62b7d4bcc904c944348c640f544796e426329294b5df7105b5495fb66af'
PRODUCTION_SHA = '83100e9cf2788b2d33959b39a6bb63fdd0e78c5e512936a07e46b22632bf7dbf'
SOURCE = '79f36144abad39a9515b8f2d7710852f1c7e7114'
AUDIT = 'c7bb4690a314721c332bd4ef7351c48bb3b743c7'
PRODUCTION = '4f2fe70f47da9cca3704722de87f7282bcc00f83'
EXPECTED = {
    'Gear/gear.json': 'e001c82a49c63b8ac21c93b559bc4768a40d267eff8bdf3fb6e73225cac64256',
    'KB/kb.json': '85bbf03d55b98432a21ed67288fc11e72c7fcf660a9af6de59ccf4beaa6268a4',
    'Catches/catches.json': 'db97091e484021f0b261b91a27c790bd9f2bd4a8221bbd432e47400e21e9459b',
}

def sha(data):
    return hashlib.sha256(data).hexdigest()

def require(condition, message):
    if not condition:
        raise ValueError(message)

def read_checked(path, expected):
    data = Path(path).read_bytes()
    require(sha(data) == expected, 'Pinned SHA-256 mismatch: ' + str(path))
    return data

def extract(archive, destination, limit=150 * 1024 * 1024):
    destination.mkdir(parents=True, exist_ok=False)
    seen = set()
    total = 0
    with zipfile.ZipFile(archive) as z:
        for info in z.infolist():
            name = info.filename
            if info.is_dir():
                continue
            parts = name.split('/')
            p = PurePosixPath(name)
            require(not p.is_absolute() and not any(x in ('', '.', '..') for x in parts)
                    and '\\' not in name and not any(ord(c) < 32 for c in name),
                    'Unsafe archive member: ' + name)
            require((info.external_attr >> 16) & 0o170000 not in (0o120000, 0o060000),
                    'Archive contains a symlink or device: ' + name)
            key = unicodedata.normalize('NFKC', name).casefold()
            require(key not in seen, 'Duplicate archive path: ' + name)
            seen.add(key)
            total += info.file_size
            require(total <= limit, 'Archive exceeds extraction budget')
            target = destination.joinpath(*parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            with z.open(info) as source, target.open('xb') as dest:
                while block := source.read(1024 * 1024):
                    dest.write(block)
    return len(seen)

def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()

def verify_inventory(root, inventory):
    entries = inventory['files']
    require(len(entries) == len({e['path'] for e in entries}), 'Duplicate audited source paths')
    for entry in entries:
        data = (root / entry['path']).read_bytes()
        require(len(data) == entry['bytes'] and sha(data) == entry['sha256'],
                'Audited source mismatch: ' + entry['path'])
    return len(entries)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--audit-zip', required=True)
    p.add_argument('--production-zip', required=True)
    p.add_argument('--workspace', required=True)
    p.add_argument('--current-source', required=True)
    p.add_argument('--output', required=True)
    p.add_argument('--repo', default=str(Path(__file__).resolve().parents[2]))
    a = p.parse_args()
    repo = Path(a.repo).resolve()
    workspace = Path(a.workspace).resolve()
    require(not workspace.exists(), 'Workspace must not already exist')
    read_checked(a.audit_zip, AUDIT_SHA)
    read_checked(a.production_zip, PRODUCTION_SHA)
    workspace.mkdir(parents=True)
    outer = workspace / 'audit'
    extract(a.audit_zip, outer)
    source_zip = outer / 'source-snapshot.zip'
    read_checked(source_zip, SOURCE_ZIP_SHA)
    summary = json.loads((outer / 'summary.json').read_text())
    require(summary['commit'] == AUDIT, 'Unexpected source audit revision')
    inventory = json.loads((outer / 'inventory.json').read_text())
    source = workspace / 'source'
    count = extract(source_zip, source)
    require(count == verify_inventory(source, inventory), 'Incomplete source snapshot')
    production = workspace / 'production'
    extract(a.production_zip, production)
    review = json.loads((repo / 'v2/migration/review-manifest.json').read_text())
    require(review['sourceCommit'] == SOURCE and review['productionCommit'] == PRODUCTION,
            'Review manifest does not match pinned source and production')
    current = Path(a.current_source).resolve()
    require(git(current, 'rev-parse', 'HEAD') == SOURCE, 'Wrong approved source checkout')
    for entry in inventory['files']:
        if entry['path'].startswith('pwa/'):
            require(sha((current / entry['path']).read_bytes()) == entry['sha256'],
                    'Approved main source differs from audited archive: ' + entry['path'])
    subprocess.run(['git', '-C', str(current), 'fetch', '--no-tags', 'origin', 'main'], check=True)
    require(git(current, 'rev-parse', 'HEAD:pwa') == git(current, 'rev-parse', 'FETCH_HEAD:pwa'),
            'Current main has new PWA changes; reconcile before migrating')
    output = Path(a.output).resolve()
    require(not output.exists(), 'Migration destination must not already exist')
    command = [sys.executable, str(repo / 'v2/migration/migrate.py'),
        '--source', str(source), '--archive', str(production), '--output', str(output),
        '--decisions', str(repo / 'v2/migration/image-decisions.csv'),
        '--review', str(repo / 'v2/migration/review-manifest.json'),
        '--inventory', str(outer / 'inventory.json'), '--source-revision', SOURCE, '--allow-pending']
    subprocess.run(command, check=True)
    for relative, expected in EXPECTED.items():
        require(sha((output / relative).read_bytes()) == expected,
                'Canonical migration output changed: ' + relative)
    report = json.loads((output / 'v2/migration/reconciliation.json').read_text())
    adopted = {r['mediaId']: r for r in review['records']
               if report['mediaDecisions'][r['mediaId']] == 'ADOPT'}
    require(len(adopted) == 49, 'Approved image count changed')
    files = {r['path']: r for r in report['files']}
    for row in adopted.values():
        dest = row['proposedPath']
        require(dest in files and files[dest]['sha256'] == row['sha256']
                and sha((output / dest).read_bytes()) == row['sha256'],
                'Approved image bytes differ: ' + row['mediaId'])
    require(report['counts'] == {'gear': {'source': 66, 'destination': 69},
            'kb': {'source': 54, 'destination': 54}, 'catches': {'source': 5, 'destination': 5}},
            'Record reconciliation mismatch')
    require(report['approval'] == 'pending-media-preview', 'Migration approval gate changed')
    result = {'sourceRevision': SOURCE, 'auditRevision': AUDIT, 'productionRevision': PRODUCTION,
              'records': report['counts'], 'approvedImages': 49,
              'canonicalHashes': EXPECTED, 'pendingExceptions': len(report['exceptions'])}
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('Migration reproduction failed: ' + str(error), file=sys.stderr)
        sys.exit(1)
