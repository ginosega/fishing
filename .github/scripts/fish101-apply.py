#!/usr/bin/env python3
import hashlib
import json
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXPECTED_MAIN = "a087b4f5be6a0702e71d29c17efc1bb3576eda93"
KB_PATH = ROOT / "KB/kb.json"

PACKAGES = {
    "knot-improved-clinch": {
        "source": "141198d1fbc1c651cd0b41d642d057c0f3b8a81c",
        "recordHash": "c400958b931ad3cfb286576b32f012af06338ba06f88e510052317cf32bae579",
        "set": {"description": "\"Fisherman's knot;\" works well with mono and fluoro on small hooks"},
        "baseFields": {"description": "Mono/fluoro terminal knot; use more wraps with lighter line and wet first."},
        "notes": {
            "path": "KB/Knots/content/improved-clinch.md",
            "baseSha256": "42e05b0633012d9cbc1f5ad1b57223edd89af9f40f0d3cd943b1aeb2d76e90f3",
            "body": "Pass the end of the line through the eye, then wrap it around the line 6-7 times for light line, 5 for heavier line. Pass the end back through the loop of line beside the eye, then then pass the end under the loop created by the final wrap. Moisten to prevent friction weakening line, tighten, and trim the end.\n\n**Uses:** The improved clinch knot, also known as the fisherman's knot, is one of the most widely used fishing knots. It works well with monofilament and fluorocarbon and provides a good method of securing a fishing line to small hooks and jig heads, lures, or swivels. The “improved” version includes an extra tuck under the loop created by the final wrap (step 9). Because it is harder to tie in heavier lines it is not recommended if you are using over 30 lb test.\n\n**Tightening:** When lubricated and pulled tight, the knot changes its structure. Pulling on the line forces the wrapped turns to redistribute the twists so that the inner strand becomes an outer wrap. When tightened the tag end is gripped closely against the hook.\n\nLoop through the eye twice for extra strength, if needed.\n\nVideo: [How to Tie the Improved Clinch Knot (Fisherman's Knot)](https://youtu.be/2YO7JWNdVC0?si=D_t6qUeE_IKGOQN-)\n",
        },
        "picture": {"path": "KB/Knots/assets/knot-improved-clinch/step-11.png", "caption": "Improved clinch knot", "baseAbsent": True},
        "sequence": [f"KB/Knots/assets/knot-improved-clinch/step-{i:02d}.png" for i in range(1, 12)],
        "sequenceBaseAbsent": True,
        "files": [
            ("KB/Knots/assets/knot-improved-clinch/step-01.png",1043062,"1594f387dd8dc1a0977e5778c5d8c1257218360d3af32d5aa30a75fca60b7621"),
            ("KB/Knots/assets/knot-improved-clinch/step-02.png",1110084,"307623f909526ede502a4f222246908dab60a755d4157527a0dd59865f025d49"),
            ("KB/Knots/assets/knot-improved-clinch/step-03.png",1229377,"0e85884f6d3c2e29b85281701feaeb1806980a768477fb51d348ea4a8af8b357"),
            ("KB/Knots/assets/knot-improved-clinch/step-04.png",1222849,"17e04a501e4e0c0c1300b6abd845df6213313a24b03c49e89440e4558a2248e5"),
            ("KB/Knots/assets/knot-improved-clinch/step-05.png",1188762,"6a7b3d62fb4323f4ba467a543cc821f4024a4b4c527a48d99df620d71cba14cc"),
            ("KB/Knots/assets/knot-improved-clinch/step-06.png",1276445,"7eda1e15740393b55b6c174adc3c4eb6b05ff9623fd5c97015ba469722723efe"),
            ("KB/Knots/assets/knot-improved-clinch/step-07.png",1246680,"19462adad989e8ad74fc0c4559e3d2e5159f7540e27384db328dda3cc81723e2"),
            ("KB/Knots/assets/knot-improved-clinch/step-08.png",1288307,"ace16a5d1da1ec439b30892f597ca3bb29dda87a1127871ca18316109f60f2f8"),
            ("KB/Knots/assets/knot-improved-clinch/step-09.png",1229342,"ff87611b2c7533f94586a660f9952f75704cae6b51e1591d0446b4350de4f292"),
            ("KB/Knots/assets/knot-improved-clinch/step-10.png",1126351,"579402176d541e5c0063fc62535332c9453f5202d619dde6f2a4803d774601bf"),
            ("KB/Knots/assets/knot-improved-clinch/step-11.png",1086906,"4c5a98caf570dd7a5de52a1a89f9362998508b8ea8232e0d552408533a775967"),
        ],
    },
    "knot-modified-uni": {
        "source": "141198d1fbc1c651cd0b41d642d057c0f3b8a81c",
        "recordHash": "392ff7662bbe96755d5943a7d54fbfdd94f5a4c0ba5257b80d9ff4f066a23c59",
        "set": {"description": "Very strong no-slip knot; good for braided line"},
        "baseFields": {"description": "Marked very strong in OneNote"},
        "notes": {
            "path": "KB/Knots/content/modified-uni.md",
            "baseSha256": "a8aa7123952c74f310fe135fe203afed40354f6184e6d93d2aedf05e6d862045",
            "body": "Pass the end through the eye twice and form a complete loop alongside the standing line. Working inside the loop, wrap the end around both lines five times. Lubricate, tighten so the loop spirals, and slide the knot to the desired loop size, or all the way down to the eye if no loop is desired. Pull on the tag end and less hard on the standing line (keep a finger or other object inside if leaving a loop) and trim the end.\n\nThe modified uni knot initially forms an adjustable loop that when tightened becomes fixed in proportion to the degree of tightening. The knot undergoes a transformation as it is tightened; the outer wraps become internal and vice versa. When used for joining two lines, each knot is tied around the other’s standing end - this is known as the double uni knot.\n\nNote that the first two pictures above only show the line going through the eye once - this is the single uni knot. Going through the eye twice is the modified or improved uni knot, which is much stronger.\n\nWhen using any loop knot with a lure, the knot must be inspected regularly for wear or fraying of the loop.\n\nVideo: [Modified Uni Knot](https://youtu.be/uIaXE9izLzo?si=hjocVKitzd5tE2m_)\n",
        },
        "picture": {"path": "KB/Knots/assets/knot-modified-uni/step-12.jpg", "caption": "Modified uni knot", "baseAbsent": True},
        "sequence": [f"KB/Knots/assets/knot-modified-uni/step-{i:02d}.jpg" for i in range(1, 13)],
        "sequenceBaseAbsent": True,
        "files": [
            ("KB/Knots/assets/knot-modified-uni/step-01.jpg",26019,"52e8d8f257ba852fa65e9fff5c818dc0b6df6aabc6c687b5f0f9178ba74f2892"),
            ("KB/Knots/assets/knot-modified-uni/step-02.jpg",38151,"81e8b7dcd21c93284c2022ae2eb4be17057d2fb07a3b254c9f09fe7da251d83b"),
            ("KB/Knots/assets/knot-modified-uni/step-03.jpg",10315,"eb788071b7708653cbd0c91fcbad5b73d8e7b1ada7f007ea6bd3345632f3cf6b"),
            ("KB/Knots/assets/knot-modified-uni/step-04.jpg",9405,"6e67c599a4ab96ae4acae7110a5ed3df23819516bf187c22feb88d41aefdd3bc"),
            ("KB/Knots/assets/knot-modified-uni/step-05.jpg",8986,"e44c054b9583be8ff4a4e22e49fc6303e64b0306c9e650b8233c2adae973afe0"),
            ("KB/Knots/assets/knot-modified-uni/step-06.jpg",8737,"584a303914be5a5f8bba8c6ce996be11f416f1a5a9f393d88e71dbe1e598e2b4"),
            ("KB/Knots/assets/knot-modified-uni/step-07.jpg",7788,"dd6e6100f0806a1381bff8cc2d5c99cd4cbe9ad516c471e7c0f5ca02ea84cfaa"),
            ("KB/Knots/assets/knot-modified-uni/step-08.jpg",6749,"b050d5c16f734be768f0f1a5e8d4540ffc560a7e8c1f7750efafa188f0593cdb"),
            ("KB/Knots/assets/knot-modified-uni/step-09.jpg",7305,"58a87c232e410fb0664ee16844d71ac03eb801c9874bf4deceb8cb38586f2b9d"),
            ("KB/Knots/assets/knot-modified-uni/step-10.jpg",6409,"a901057958afb1231e634fa2fa22896acb35266cb761855e6d0a2694a0b1e183"),
            ("KB/Knots/assets/knot-modified-uni/step-11.jpg",6944,"f2ed34fcff349fa38e8bdf8f2251da9ee28064c225eeedf3fed32a7b4c38d68e"),
            ("KB/Knots/assets/knot-modified-uni/step-12.jpg",5515,"909ff347c15314826536298c3df4f87a0204b009d4927fa0dee2a27e15ddd3aa"),
        ],
    },
    "knot-loop-non-slip-loop": {
        "source": "60cfdbea899040be9b4685a4e22caf8bf8e43cd5",
        "recordHash": "dc6347fb55a27ccb1918bcb2b38e3858b2c6d5ebba40294439887ae5154b17af",
        "set": {"name": "Non-Slip Loop Knot", "description": "Good for crankbaits that do not have a split ring attached"},
        "baseFields": {"name": "Loop / Non-slip Loop Knot", "description": "Conflict: technique pages recommend loop knots; knot note warns against them."},
        "notes": {
            "path": "KB/Knots/content/loop-non-slip-loop.md",
            "baseSha256": "3dccffced4c43b67ab52b8ab8bd05c24e0c110af1c2642d950f4667c6341c3e0",
            "body": "The non-slip loop knot is a good knot for crankbaits that do not have a split ring attached to their eye because it allows for more side-to-side action of the bait than a palomar or modified uni knot that cinches directly to the eye.\n\nWhen using any loop knot with a lure, the knot must be inspected regularly for wear or fraying of the loop.\n\nVideo: [How to Tie a Non Slip Loop Knot](https://youtu.be/yT5kC35LVIk?si=svwuICDg_A04AAkw)\n",
        },
        "picture": {"path": "KB/Knots/assets/Non-Splip Loop Knot.png", "caption": "Non-slip loop knot", "baseAbsent": True},
        "files": [("KB/Knots/assets/Non-Splip Loop Knot.png",216158,"61e7ac1041936606a0dbf28c11f1c7b3ce4ecc656dbf60191661ffbca7aef4f0")],
    },
    "knot-palomar": {
        "source": "60cfdbea899040be9b4685a4e22caf8bf8e43cd5",
        "recordHash": "d09e83e7cfc3ddd6531389fc460620c66b23cfafb5a1b4866f6c20c89be8e94a",
        "set": {}, "baseFields": {},
        "notes": {
            "path": "KB/Knots/content/palomar.md",
            "baseSha256": "52e49db7d774145f1a6b8b007c2a445dcdcffe8a96dfb5a1ddbc9bda3d142802",
            "body": "Double the end of the line to form a bight, pass it through the eye of the hook, and tie a loose overhand knot on the standing line. Pass the bight over the hook and down around the knot. Lubricate and pull the standing and tag ends to tighten the knot. Trim the tag end. Make sure the loop cinches evenly and completely above the eye — don’t cross lines, and don't leave any of the line caught below the eye.\n\n**Uses:** The Palomar Knot is a simple knot for attaching a line to a hook or lure. It is regarded as one of the strongest and most reliable fishing knots. It is good for all line types, and its resistance against slippage makes it good for use with braided line.\n\nVideo: [Palomar Knot](https://youtube.com/shorts/IlQDI4bi694?is=zoKRljv9K4l7K5yp)",
        },
    },
    "knot-trilene": {
        "source": "60cfdbea899040be9b4685a4e22caf8bf8e43cd5",
        "recordHash": "a94a4c50a46bf8aeebfdcf5735b85792684471525c2ca01169b416ddfccc2db2",
        "set": {"description": "Good for tying fluorocarbon line to swivels and snaps"},
        "baseFields": {"description": "Good for tying fluorocarbon to swivels/snaps; wet before tightening"},
        "notes": {
            "path": "KB/Knots/content/trilene.md",
            "baseSha256": "b9c64037477adcd6021d373bfe703be9f87353623c3a2aa3461a8c86f60a4757",
            "body": "Pass the tag end of the line through the eye twice. Wrap it around the standing end five or six times. Thread the end through the original loop beside the eye. Lubricate and pull the knot tight. Trim the end, but leave about an eighth of an inch for security.\n\n**Uses:** The double wrap of line through the eye makes the Trilene knot a strong and reliable knot to join monofilament line to hooks, swivels and lures. It resists slippage and failures and is an alternative to the improved clinch knot.\n\nVideo: [How to tie the Trilene knot](https://youtu.be/MQ9sCXQNGMI?si=iax_MRbQzznHMF4j)",
        },
        "picture": {"path": "KB/Knots/assets/knot-trilene/step-15.png", "caption": "Trilene knot", "baseAbsent": True},
        "sequence": [f"KB/Knots/assets/knot-trilene/step-{i:02d}.png" for i in range(1, 16)],
        "sequenceBaseAbsent": True,
        "files": [
            ("KB/Knots/assets/knot-trilene/step-01.png",1537196,"07deff3ca4ede02848caf32ff1fb8f1622f41fbfa4c7bf4f9a1917ad64e7b0f3"),
            ("KB/Knots/assets/knot-trilene/step-02.png",1353966,"a13f56e874193ad3d37bd59fa465ae803d8186c580a59e5112a8eadf224d4efe"),
            ("KB/Knots/assets/knot-trilene/step-03.png",1434496,"a4de55d1cd58b8bd67ce3747be207399d2dc7e98c4267945717c91d8b4c7e938"),
            ("KB/Knots/assets/knot-trilene/step-04.png",1380763,"3e40f4a61262d7573deb044adc0ba06af5116f15d9f50e88f20dcdd820293c79"),
            ("KB/Knots/assets/knot-trilene/step-05.png",1397212,"dabd7df0fb89df841ee325b0e12be8c63e5728c05999f3301fdfe879b00aabb5"),
            ("KB/Knots/assets/knot-trilene/step-06.png",1432978,"0b3434ab151ce8f952a402d2fa2523b0e6554f8b1f96d68d8ac63ebb7898655d"),
            ("KB/Knots/assets/knot-trilene/step-07.png",1413430,"34bed4f3a7f02b6e5e8aeab3aa72206612d8fff4221b4c636c1335721b54a3c2"),
            ("KB/Knots/assets/knot-trilene/step-08.png",1354870,"448268d5af5cf1d7d082540496b8051c85b4d6ba672aa2832648adfe04e10c4e"),
            ("KB/Knots/assets/knot-trilene/step-09.png",1315552,"0aa9e3094de838cc723f51e0e9f689bb4dd5daec5276e455e225f4122aab8728"),
            ("KB/Knots/assets/knot-trilene/step-10.png",1346536,"e9e3ea4bca770b34cabcb6c6d2c49bdc1055f3f4a1e8a53ea1549da68eeea70c"),
            ("KB/Knots/assets/knot-trilene/step-11.png",1280653,"45d52d3b69dd1e126d6d2a0c0967f60af7d6a2255653f4cc36963fa6add7b06c"),
            ("KB/Knots/assets/knot-trilene/step-12.png",1393333,"3d8e4e446eeef15eb414ec02f74f8f104b53f4f49611b139c6f50f017954dcdc"),
            ("KB/Knots/assets/knot-trilene/step-13.png",1316249,"dad9d1d9cf641bac43fe12bc5ae2c1245e7e158459bf0dc96de94a052d880001"),
            ("KB/Knots/assets/knot-trilene/step-14.png",1275766,"76efd534119aa30826e5a861fcec4634e49ba19c1d5e9259f605e4c2279b9e97"),
            ("KB/Knots/assets/knot-trilene/step-15.png",1287006,"b96059e1ee25bf5eff20288dcf1fdd0ccaac9b1c8a54bbe396459c2c53ac9797"),
        ],
    },
    "bowline-knot": {
        "source": "52afc4335445706fa07d210dd8f3f2823e9636eb",
        "recordHash": "fdd28b8afb0ed98c6ff556f89b65abe106e6755c35e2b89a760d1e8ebbac3fff",
        "set": {"description": "Use for tying a rope to the bow of a boat"},
        "baseFields": {"description": {"$absent": True}},
    },
}

DELETIONS = ["Double Uni Knot", "Single Uni Knot"]


def canonical(value):
    if isinstance(value, list):
        return "[" + ",".join(canonical(v) for v in value) + "]"
    if isinstance(value, dict):
        return "{" + ",".join(json.dumps(k, ensure_ascii=False, separators=(",", ":")) + ":" + canonical(value[k]) for k in sorted(value)) + "}"
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def fingerprint(record):
    return sha256_bytes(canonical(record).encode("utf-8"))


def assert_ancestor(source):
    subprocess.run(["git", "merge-base", "--is-ancestor", source, "HEAD"], cwd=ROOT, check=True)


def load_text(path):
    return (ROOT / path).read_text(encoding="utf-8")


def main():
    kb = json.loads(KB_PATH.read_text(encoding="utf-8"))
    entities = kb["entities"]
    by_id = {r["id"]: r for r in entities}
    assert len(by_id) == len(entities), "Duplicate KB IDs"

    for pkg_id, pkg in PACKAGES.items():
        assert_ancestor(pkg["source"])
        rec = by_id.get(pkg_id)
        assert rec is not None, f"Missing record: {pkg_id}"
        actual_hash = fingerprint(rec)
        assert actual_hash == pkg["recordHash"], f"Record hash mismatch {pkg_id}: {actual_hash}"
        for field, expected in pkg.get("baseFields", {}).items():
            if isinstance(expected, dict) and expected.get("$absent") is True:
                assert field not in rec, f"Expected absent field {pkg_id}.{field}"
            else:
                assert rec.get(field) == expected, f"Base field mismatch {pkg_id}.{field}"
        notes = pkg.get("notes")
        if notes:
            assert rec.get("content") == notes["path"], f"Narrative path mismatch {pkg_id}"
            actual_notes_hash = sha256_bytes((ROOT / notes["path"]).read_bytes())
            assert actual_notes_hash == notes["baseSha256"], f"Narrative hash mismatch {pkg_id}: {actual_notes_hash}"
        picture = pkg.get("picture")
        if picture and picture.get("baseAbsent"):
            assert "picture" not in rec, f"Expected absent picture: {pkg_id}"
        if pkg.get("sequenceBaseAbsent"):
            assert "pictureSequence" not in rec, f"Expected absent sequence: {pkg_id}"
        if pkg.get("sequence"):
            assert pkg["sequence"][-1] == picture["path"], f"Representative is not final sequence frame: {pkg_id}"
        for rel, expected_bytes, expected_hash in pkg.get("files", []):
            path = ROOT / rel
            assert path.is_file(), f"Missing staged media: {rel}"
            data = path.read_bytes()
            assert len(data) == expected_bytes, f"Byte-count mismatch {rel}: {len(data)}"
            actual = sha256_bytes(data)
            assert actual == expected_hash, f"SHA-256 mismatch {rel}: {actual}"

    deletion_records = []
    for name in DELETIONS:
        matches = [r for r in entities if r.get("type") == "knot" and r.get("name") == name]
        assert len(matches) == 1, f"Deletion target must resolve exactly once: {name} ({len(matches)})"
        rec = matches[0]
        content = rec.get("content")
        assert content and (ROOT / content).is_file(), f"Deletion content missing: {name}"
        deletion_records.append(rec)

    # Apply only the requested structured/content/media-reference changes.
    for pkg_id, pkg in PACKAGES.items():
        rec = by_id[pkg_id]
        for field, value in pkg.get("set", {}).items():
            rec[field] = value
        notes = pkg.get("notes")
        if notes:
            (ROOT / notes["path"]).write_text(notes["body"], encoding="utf-8")
        picture = pkg.get("picture")
        if picture:
            rec["picture"] = {"src": picture["path"], "caption": picture["caption"]}
        if pkg.get("sequence"):
            rec["pictureSequence"] = pkg["sequence"]

    delete_ids = {r["id"] for r in deletion_records}
    kb["entities"] = [r for r in entities if r["id"] not in delete_ids]
    for rec in deletion_records:
        (ROOT / rec["content"]).unlink()

    # Minimal post-apply invariants before the repository's own full tests.
    new_by_id = {r["id"]: r for r in kb["entities"]}
    assert not delete_ids.intersection(new_by_id), "Deleted knot still present"
    for pkg_id, pkg in PACKAGES.items():
        rec = new_by_id[pkg_id]
        for field, value in pkg.get("set", {}).items():
            assert rec.get(field) == value
        if pkg.get("picture"):
            assert rec["picture"]["src"] == pkg["picture"]["path"]
        if pkg.get("sequence"):
            assert rec["pictureSequence"] == pkg["sequence"]
            assert rec["picture"]["src"] == rec["pictureSequence"][-1]

    KB_PATH.write_text(json.dumps(kb, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print("FISH101 validation and apply succeeded")
    print("validated package records:", ", ".join(PACKAGES))
    print("validated staged media files:", sum(len(p.get("files", [])) for p in PACKAGES.values()))
    print("deleted knots:", ", ".join(f"{r['name']} ({r['id']})" for r in deletion_records))


if __name__ == "__main__":
    main()
