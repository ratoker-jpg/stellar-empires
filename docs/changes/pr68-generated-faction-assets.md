# PR #68 — Import remaining generated faction source assets

## Scope

This PR imports the supplied `stellar_empires_generated_assets.zip` archive as the third verified source-only asset pack: `assets/source/generated-factions-v1/`. It adds no runtime asset URL, atlas, scene, UI, gameplay or generated public derivative.

## Archive audit

- Source archive: `C:\Users\Den\Documents\New project\stellar_empires_generated_assets.zip`
- Archive SHA-256: `7ca08964d12cd0c3a4a42c88b2ed111d10e81f8a29dbbc55c8e17523546fa75f`
- ZIP bytes: 12,459,087
- Imported members: 10 PNG files, 12,466,966 uncompressed bytes
- Validation: ZIP CRC, safe relative paths, PNG signatures/dimensions, byte sizes and member SHA-256 values

The archive contains nine faction identity alternatives plus `faction_contact_sheet.png`. The contact sheet is retained at `previews/faction_contact_sheet.png` with the `preview-only` role.

## Collision handling

All nine faction-named PNG files share their filenames with starter-pack assets but have different SHA-256 values. They are therefore retained as distinct source files in `generated-factions-v1`; no starter or faction-delivery source binary is replaced. There are no byte-identical duplicates, so every `duplicateOf` field is blank.

## Importer contract

`tools/import_user_asset_packs.py` now accepts optional `--generated-factions` while preserving the existing required `--starter` and `--faction` interface. It validates archive CRC, duplicate members, optional archive-root stripping and a 100 MiB member limit before writing only inventory-registered files. This pack's flat ZIP members are matched by their unique basenames to inventory paths, allowing the contact sheet to be stored at its required `previews/` path.

## Runtime status

The committed source library has 172 files and 173,846,727 uncompressed bytes. Existing compact WebP/SVG runtime assets are partially connected independently; this new pack remains source-only and requires a future explicit registry/derivative integration PR.
