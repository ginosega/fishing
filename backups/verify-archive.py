"""Create the existing recovery ZIP format and independently verify every entry."""
import hashlib
import json
import pathlib
import sys
import zipfile

def digest(data):
    return hashlib.sha256(data).hexdigest()

def create_and_verify(stage, archive):
    stage, archive = pathlib.Path(stage), pathlib.Path(archive)
    manifest = json.loads((stage / "manifest.json").read_text(encoding="utf-8"))
    images = manifest["images"]
    expected = {"content.sql", "manifest.json", "README.txt"}
    assert len(images) == manifest["imageCount"]
    for image in images:
        assert image["file"] == "images/" + image["sha256"]
        assert image["file"] not in expected
        expected.add(image["file"])
    actual = {p.relative_to(stage).as_posix() for p in stage.rglob("*") if p.is_file()}
    assert actual == expected
    with zipfile.ZipFile(archive, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for name in sorted(expected):
            z.write(stage / name, name)
    with zipfile.ZipFile(archive, "r") as z:
        assert len(z.namelist()) == len(expected) and set(z.namelist()) == expected
        for name in expected:
            assert digest(z.read(name)) == digest((stage / name).read_bytes())
        assert digest(z.read("content.sql")) == manifest["database"]["sha256"]
        total = 0
        for image in images:
            data = z.read(image["file"])
            assert len(data) == image["bytes"] and digest(data) == image["sha256"]
            total += len(data)
        assert total == manifest["imageBytes"]
    return digest(archive.read_bytes())

if __name__ == "__main__":
    output = pathlib.Path(sys.argv[2])
    checksum = create_and_verify(sys.argv[1], output)
    with pathlib.Path(str(output) + ".sha256").open("x", encoding="ascii") as f:
        f.write(checksum + "\n")
