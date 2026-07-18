# 02 — UI map

`CONFIRMED_UI`: the persistent shell exposes Planet, Flights, Galaxy, Alliance, Personal, Ranking, Commander Ship, three zone links, admiral statistics/skills, auction, arena, tutorial, Discord, and Help.

| Screen | Visible data | Safe observed action | Connection | Evidence |
| --- | --- | --- | --- | --- |
| Planet | score, resource score, battle score, ozone, population | navigate to overview/galaxy | resource and military zones | `screens/01-planet-overview.png` |
| Resource zone | hourly resource output and ozone | open information tabs only | economy/buildings | `screens/02-resource-zone.png` |
| Industry zone | zone heading and building slots | none | buildings | `screens/03-industry-zone.png` |
| Military zone | zone heading and building slots | none | shipyard/defense | `screens/04-military-zone.png` |
| Shipyard | level, queue duration, tabs, lock text | read-only tabs | technologies, flights, battles | `screens/05-commander-ships.png` |
| Laboratory | level, four research groups, queue | open technology list | research prerequisites | `screens/08-laboratory.png` |
| Technologies | categories, science names, visible levels/requirements | open information card | ships/defense/buildings | `screens/09-technologies.png` |
| Flights | owned ships, mission selector | none | mission execution | `screens/13-fleets.png` |
| Galaxy | coordinate fields, search, advanced search | none | system entities | `screens/14-galaxy-system.png` |

Several individual technology and ship requirements are now captured; their full mechanics remain `UNKNOWN`.
