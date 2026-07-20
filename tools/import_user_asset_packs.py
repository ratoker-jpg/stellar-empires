#!/usr/bin/env python3
"""Import validated user-supplied Stellar Empires source packs.

Usage:
  py tools/import_user_asset_packs.py \
    --starter "D:\\Downloads\\stellar_empires_starter_asset_pack-fixed(1).zip" \
    --faction "D:\\Downloads\\stellar_empires_faction_assets_delivery_v1(1).zip"

The script extracts only paths listed in docs/assets/user-supplied-asset-inventory.json,
verifies byte size and SHA-256, and refuses unexpected or unsafe paths.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
import zipfile
from pathlib import Path, PurePosixPath

REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = REPO_ROOT / "docs" / "assets" / "user-supplied-asset-inventory.json"


def normalize_member(name: str) -> str:
    normalized = name.replace("\\", "/")
    parts = PurePosixPath(normalized).parts
    if not parts or any(part in {"", ".", ".."} for part in parts):
        raise ValueError(f"Unsafe archive member: {name!r}")
    if any(part == "__MACOSX" or part.startswith("._") for part in parts):
        raise ValueError(f"Unsupported metadata member: {name!r}")
    return "/".join(parts)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def extract_pack(pack: dict[str, object], archive_path: Path) -> tuple[int, int]:
    pack_id = str(pack["id"])
    target_directory = Path(str(pack["targetDirectory"]))
    expected = list(pack["files"])
    if not archive_path.is_file():
        raise FileNotFoundError(f"Archive not found: {archive_path}")

    expected_by_source = {str(entry["path"]): entry for entry in expected}
    found_sources: set[str] = set()
    written = 0
    written_bytes = 0

    with zipfile.ZipFile(archive_path) as archive:
        for info in archive.infolist():
            if info.is_dir():
                continue
            try:
                source_path = normalize_member(info.filename)
            except ValueError as error:
                if "metadata" in str(error).lower():
                    continue
                raise

            entry = expected_by_source.get(source_path)
            if entry is None:
                raise RuntimeError(f"Unexpected file in {pack_id}: {source_path}")

            data = archive.read(info)
            actual_sha = sha256_bytes(data)
            expected_sha = str(entry["sha256"])
            expected_bytes = int(entry["bytes"])
            if len(data) != expected_bytes:
                raise RuntimeError(
                    f"Size mismatch for {source_path}: expected {expected_bytes}, got {len(data)}"
                )
            if actual_sha != expected_sha:
                raise RuntimeError(
                    f"SHA-256 mismatch for {source_path}: expected {expected_sha}, got {actual_sha}"
                )

            target_relative = target_directory / Path(source_path)
            target = (REPO_ROOT / target_relative).resolve()
            source_root = (REPO_ROOT / "assets" / "source").resolve()
            if source_root not in target.parents:
                raise RuntimeError(f"Target escapes assets/source: {target_relative}")

            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            found_sources.add(source_path)
            written += 1
            written_bytes += len(data)

    missing = sorted(set(expected_by_source) - found_sources)
    if missing:
        raise RuntimeError(f"Missing {len(missing)} expected files in {pack_id}: {missing[:5]}")

    return written, written_bytes


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--starter", type=Path, required=True, help="Path to the starter pack ZIP")
    parser.add_argument("--faction", type=Path, required=True, help="Path to faction delivery v1 ZIP")
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Delete assets/source/starter and assets/source/faction-delivery-v1 before import",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    packs = {str(pack["id"]): pack for pack in manifest["packs"]}

    if args.clean:
        for pack in packs.values():
            directory = REPO_ROOT / str(pack["targetDirectory"])
            if directory.exists():
                shutil.rmtree(directory)

    archive_by_pack = {
        "starter": args.starter,
        "faction-delivery-v1": args.faction,
    }

    total_files = 0
    total_bytes = 0
    for pack_id, archive_path in archive_by_pack.items():
        count, byte_count = extract_pack(packs[pack_id], archive_path)
        total_files += count
        total_bytes += byte_count
        print(f"PASS {pack_id}: {count} files, {byte_count} bytes")

    expected_total_files = sum(int(pack["fileCount"]) for pack in packs.values())
    expected_total_bytes = sum(int(pack["uncompressedBytes"]) for pack in packs.values())
    if total_files != expected_total_files or total_bytes != expected_total_bytes:
        raise RuntimeError(
            f"Total mismatch: expected {expected_total_files}/{expected_total_bytes}, "
            f"got {total_files}/{total_bytes}"
        )

    print(f"PASS total: {total_files} files, {total_bytes} bytes")
    print("Source assets imported. They are not runtime-connected until a separate integration PR.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
