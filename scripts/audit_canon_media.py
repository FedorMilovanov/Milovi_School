#!/usr/bin/env python3
"""Fail-closed binary/media contract for Le Canon Sucré artwork."""
from __future__ import annotations

import hashlib
import re
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEDIA_DIR = ROOT / "public" / "images" / "canon-sucre"
MEDIA_SOURCE = ROOT / "src" / "data" / "canon-media.ts"
DIST_CANON = ROOT / "dist" / "canon" / "index.html"

EXPECTED_COUNT = 15
EXPECTED_WIDTH = 1280
EXPECTED_HEIGHT = 800
MAX_FILE_BYTES = 180 * 1024
MAX_TOTAL_BYTES = 2 * 1024 * 1024

BINDING_RE = re.compile(
    r"(?m)^\s*(?:'([^']+)'|([A-Za-z0-9_-]+))\s*:\s*\{\s*\n\s*image\s*:\s*'([^']+)'"
)
IMG_TAG_RE = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
SRC_RE = re.compile(r"\bsrc=[\"']([^\"']+)[\"']", re.IGNORECASE)


def webp_dimensions(data: bytes) -> tuple[int, int]:
    if len(data) < 20 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise ValueError("not a RIFF/WebP file")

    declared_size = struct.unpack_from("<I", data, 4)[0] + 8
    if declared_size != len(data):
        raise ValueError(f"RIFF size mismatch: header={declared_size}, actual={len(data)}")

    offset = 12
    while offset + 8 <= len(data):
        fourcc = data[offset : offset + 4]
        size = struct.unpack_from("<I", data, offset + 4)[0]
        start = offset + 8
        end = start + size
        if end > len(data):
            raise ValueError(f"truncated {fourcc.decode('ascii', errors='replace')} chunk")
        payload = data[start:end]

        if fourcc == b"VP8 ":
            if len(payload) < 10 or payload[3:6] != b"\x9d\x01\x2a":
                raise ValueError("invalid VP8 keyframe header")
            width = struct.unpack_from("<H", payload, 6)[0] & 0x3FFF
            height = struct.unpack_from("<H", payload, 8)[0] & 0x3FFF
            return width, height

        if fourcc == b"VP8L":
            if len(payload) < 5 or payload[0] != 0x2F:
                raise ValueError("invalid VP8L header")
            bits = int.from_bytes(payload[1:5], "little")
            width = (bits & 0x3FFF) + 1
            height = ((bits >> 14) & 0x3FFF) + 1
            return width, height

        if fourcc == b"VP8X":
            if len(payload) < 10:
                raise ValueError("invalid VP8X header")
            width = int.from_bytes(payload[4:7], "little") + 1
            height = int.from_bytes(payload[7:10], "little") + 1
            return width, height

        offset = end + (size & 1)

    raise ValueError("no VP8/VP8L/VP8X image chunk found")


if not MEDIA_SOURCE.exists():
    raise SystemExit("[canon-media] Missing src/data/canon-media.ts")
if not MEDIA_DIR.is_dir():
    raise SystemExit("[canon-media] Missing public/images/canon-sucre/")

source = MEDIA_SOURCE.read_text("utf-8")
bindings: dict[str, str] = {}
for quoted_id, bare_id, image in BINDING_RE.findall(source):
    work_id = quoted_id or bare_id
    if work_id in bindings:
        raise SystemExit(f"[canon-media] Duplicate media binding id: {work_id}")
    bindings[work_id] = image

if len(bindings) != EXPECTED_COUNT:
    raise SystemExit(f"[canon-media] Expected {EXPECTED_COUNT} media bindings, found {len(bindings)}")

expected_paths = {f"/images/canon-sucre/{work_id}.webp" for work_id in bindings}
actual_paths = {f"/images/canon-sucre/{path.name}" for path in MEDIA_DIR.glob("*.webp")}
if set(bindings.values()) != expected_paths:
    unexpected = sorted(set(bindings.values()) - expected_paths)
    missing = sorted(expected_paths - set(bindings.values()))
    raise SystemExit(f"[canon-media] Canon ID/path mismatch: unexpected={unexpected}; missing={missing}")
if actual_paths != expected_paths:
    missing = sorted(expected_paths - actual_paths)
    extra = sorted(actual_paths - expected_paths)
    raise SystemExit(f"[canon-media] Pack/file mismatch: missing={missing}; extra={extra}")

seen_hashes: dict[str, str] = {}
total_bytes = 0
rows: list[tuple[str, int]] = []

for work_id in sorted(bindings):
    relative = bindings[work_id].removeprefix("/")
    path = ROOT / "public" / relative
    data = path.read_bytes()
    total_bytes += len(data)

    try:
        width, height = webp_dimensions(data)
    except ValueError as error:
        raise SystemExit(f"[canon-media] {work_id}: {error}") from error

    if (width, height) != (EXPECTED_WIDTH, EXPECTED_HEIGHT):
        raise SystemExit(
            f"[canon-media] {work_id}: expected {EXPECTED_WIDTH}x{EXPECTED_HEIGHT}, got {width}x{height}"
        )
    if len(data) > MAX_FILE_BYTES:
        raise SystemExit(
            f"[canon-media] {work_id}: {len(data)} bytes exceeds {MAX_FILE_BYTES}-byte per-file budget"
        )

    digest = hashlib.sha256(data).hexdigest()
    duplicate = seen_hashes.get(digest)
    if duplicate:
        raise SystemExit(f"[canon-media] Duplicate binary artwork: {duplicate} and {work_id}")
    seen_hashes[digest] = work_id
    rows.append((work_id, len(data)))

if total_bytes > MAX_TOTAL_BYTES:
    raise SystemExit(
        f"[canon-media] Pack weighs {total_bytes} bytes, above {MAX_TOTAL_BYTES}-byte total budget"
    )

rendered_note = "generated Canon HTML not present; binary contract only"
if DIST_CANON.exists():
    html = DIST_CANON.read_text("utf-8", errors="replace")
    work_tags = [tag for tag in IMG_TAG_RE.findall(html) if "canon-work-image" in tag]
    rendered_sources = []
    for tag in work_tags:
        match = SRC_RE.search(tag)
        rendered_sources.append(match.group(1) if match else "")

    if len(work_tags) != EXPECTED_COUNT:
        raise SystemExit(f"[canon-media] Built /canon/ must render {EXPECTED_COUNT} work images, found {len(work_tags)}")
    if len(set(rendered_sources)) != EXPECTED_COUNT:
        raise SystemExit("[canon-media] Built /canon/ must render 15 unique work image sources")
    invalid_sources = sorted(src for src in rendered_sources if src not in expected_paths)
    if invalid_sources:
        raise SystemExit(f"[canon-media] Built /canon/ uses media outside the dedicated pack: {invalid_sources}")
    if "canon-catalogue-plate" in html:
        raise SystemExit("[canon-media] Catalogue plates are forbidden now that the 15/15 production pack exists")
    rendered_note = "built /canon/ renders 15/15 dedicated images and 0 catalogue plates"

print("# Le Canon Sucré media quality gate")
print(f"- PASS: {len(rows)} unique WebP assets")
print(f"- PASS: all assets are {EXPECTED_WIDTH}x{EXPECTED_HEIGHT}")
print(f"- PASS: total pack {total_bytes / 1024:.1f} KiB (budget {MAX_TOTAL_BYTES / 1024:.0f} KiB)")
print(f"- PASS: largest asset {max(size for _, size in rows) / 1024:.1f} KiB (budget {MAX_FILE_BYTES / 1024:.0f} KiB)")
print(f"- PASS: {rendered_note}")
