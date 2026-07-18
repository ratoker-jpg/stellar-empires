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
| 2026-07-18 | `http://forums.incuvationgames.com/viewforum.php?f=22` | Help link | not opened after session boundary | UNKNOWN |

No DOM/network/CDP extraction, asset copying, or irreversible UI action was performed. Source UI can change; screenshots provide capture-time evidence only and have privacy masks for player information and pinpointable coordinates.
