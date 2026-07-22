# Source log

| UTC date | Source | Purpose | Result | Status |
| --- | --- | --- | --- | --- |
| 2026-07-18 | `https://game.ares.nemexia.com/planet.php?d=0` | Planet shell and account context | captured read-only | CONFIRMED_UI |
| 2026-07-18 | `zone_resource.php?race=1` | Resource zone | captured read-only | CONFIRMED_UI |
| 2026-07-18 | `zone_industry.php` | Industry zone | captured read-only | CONFIRMED_UI |
| 2026-07-18 | `zone_military.php` | Military zone | captured read-only | CONFIRMED_UI |
| 2026-07-18 | `ships.php?show=CommanderShips` | Shipyard navigation and lock | captured read-only | CONFIRMED_UI |
| 2026-07-18 | `technics.php?showTab=ships` | Technology screen | redirected to login | ACTION_REQUIRED |
| 2026-07-18 | `https://game.horus.nemexia.com/zone_industry.php` | authenticated second-server context | captured read-only | CONFIRMED_UI |
| 2026-07-18 | `laboratory.php` | research groups and level | captured read-only | CONFIRMED_UI |
| 2026-07-18 | `technics.php?showTab=Researches` | technology categories and science list | captured read-only | CONFIRMED_UI |
| 2026-07-18 | `information.php?type=science&id=1` | Physics information card | captured read-only | CONFIRMED_UI |
| 2026-07-18 | `ships.php` | ship list, costs, requirements, timers | captured read-only | CONFIRMED_UI |
| 2026-07-18 | `fleets.php` | mission selector and available ships | captured read-only; no form fields changed | CONFIRMED_UI |
| 2026-07-18 | `galaxy.php?galaxy=2&solar=27` | galaxy navigation | captured read-only | CONFIRMED_UI |
| 2026-07-18 | `https://help.nemexia.com/` | old-help endpoint availability | loads 2Axion Help Home | CONFIRMED_HELP |
| 2026-07-18 | `https://help.nemexia.com/en_EN/nemexia-new.html` | Nemexia help index and Races links | loaded read-only | CONFIRMED_HELP |
| 2026-07-18 | Horus `zone_industry.php` revisit | deeper building-card research | session returned to login; no retry or authentication attempt | ACTION_REQUIRED |
| 2026-07-18 | Horus `fleets.php?show=Simulator` | battle-simulator structure | captured read-only; Start, Save, Delete and form edits avoided | CONFIRMED_UI |
| 2026-07-18 | Horus `ranking.php` | ranking landing page | opened read-only; rows not exposed in semantic view | CONFIRMED_UI |
| 2026-07-18 | Horus `alliance.php` | alliance entry conditions | read-only; Command Chamber level 1 lock observed | LOCKED |
| 2026-07-18 | Horus `options.php` | social/profile feature inventory | read-only; messages and settings not opened or changed | CONFIRMED_UI |
| 2026-07-18 | Horus `fleets.php?show=Battles` | battle-report landing page | read-only; saved and recent report tables were empty | CONFIRMED_UI |
| 2026-07-18 | Horus `advanced_search.php` | galaxy-search modes | read-only; no query entered or submitted | CONFIRMED_UI |
| 2026-07-18 | Horus `arena.php` | arena schedule and entry points | read-only; did not join a battle | CONFIRMED_UI |
| 2026-07-18 | `http://forums.incuvationgames.com/viewforum.php?f=22` | Help link | not opened after session boundary | UNKNOWN |
| 2026-07-18 | Help overview articles: Galaxy, Planet, Resources, Buildings, Science, Ships, Commander Ships, Defence | historical mechanics inventory | opened read-only; details recorded in `data/help-articles.json` | CONFIRMED_HELP |
| 2026-07-18 | Help overview articles: Universe, Crystals, Obelisks, SSG, Flights, Alliance, Battles, Admiral, Renegades | historical strategy/combat inventory | opened read-only; no game action | CONFIRMED_HELP |
| 2026-07-18 | Help overview articles: Profile, Rankings, Achievements, Services, Arena, New units statistics, faction articles | historical meta/unit inventory | opened read-only; New Units is explicitly some-universes-only | CONFIRMED_HELP |
| 2026-07-18 | Horus `ships.php` | complete visible Terteth ship-card capture; Defence-tab read | no quantity entered, no construction; Defence cards not exposed at level 1 | CONFIRMED_UI |
| 2026-07-22 | User archive `Корабли, боевые корабли, оборона, наука.zip` | complete information-card inventory | all 101 saved HTML cards parsed: 39 standard ships, 13 shared commander ships, 27 defenses and 22 sciences; archive SHA-256 recorded in document 19 | USER_CAPTURED_HTML |
| 2026-07-22 | User archive `stellar-empires-building-descriptions-screenshots.zip` | full building-function inventory | all 72 screenshots reviewed: 22 ordinary and 2 galactic cards for each of three factions; archive SHA-256 recorded in document 19 | USER_CAPTURED_SCREENSHOT |
| 2026-07-22 | Three `stellar-empires-buildings-regenerated-*-cleaned-v3.zip` archives | original/generated Stellar Empires building-art QA | 24 assets per faction reviewed; RGBA sizes, alpha, atlases, duplicate hashes and manifest shapes checked; binaries intentionally deferred | USER_GENERATED_ASSET |

No DOM/network/CDP extraction, irreversible UI action or runtime asset copying was performed during the browser audit. The supplied 2026-07-22 package was processed locally and read-only. Raw original-game HTML, screenshots and downloaded images are excluded from Git; only normalized derived documentation is committed.
