# 16 — Differences from current roadmap

Stellar Empires currently exposes an original Galaxy scene and a Planet screen, while Science, Fleet, Reports, and System navigation are disabled. The browser evidence supports future original work on progression information architecture, zone categories, locks, and a deterministic exploration/fleet loop—but does not justify copying Nemexia layouts, balance, assets, or terminology.

Exact gaps in technologies, units, defenses, missions, galaxy entity types, combat, and social systems remain `UNKNOWN` because the captured session did not expose their content.

## Required architecture migration (documentation only)

The current Stellar Empires prototype is not organized around Nemexia’s three-zone model. Any future original implementation should explicitly migrate planet progression into **Resource**, **Industry**, and **Military** domain groups before adding their dependent systems. That migration must define stable internal data contracts for named costs, build time, prerequisites, queue state, unlock state, and original UI routes; it must not copy Nemexia screens, art, terms, values, or code. This audit makes no product-code changes.
