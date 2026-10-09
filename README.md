# OfflineLink

An unofficial, offline desktop tournament notebook for Magic: The Gathering organizers. Official Wizards reporting stays in EventLink.

## Installation

1. Download the ZIP file from [GitHub](https://github.com/AndreasArvidsson/offline-link/releases/latest).
    - [Windows](https://github.com/AndreasArvidsson/offline-link/releases/latest/download/OfflineLink-Windows.zip)
    - [Linux](https://github.com/AndreasArvidsson/offline-link/releases/latest/download/OfflineLink-Linux.zip)
    - [macOS](https://github.com/AndreasArvidsson/offline-link/releases/latest/download/OfflineLink-macOS.zip)
2. Extract the ZIP file.
3. Run the OfflineLink executable (e.g. `OfflineLink.exe`).
4. If asked whether you want to run this unrecognized application, choose Run/Continue.

## Rule definitions

OfflineLink is based on the [Magic Tournament Rules (MTR) - Feb 27, 2026](https://media.wizards.com/ContentResources/WPN/MTG_MTR_2026_Feb27_EN.pdf).

## Swiss pairing algorithm

OfflineLink uses [Swiss-system pairings](https://en.wikipedia.org/wiki/Swiss-system_tournament).

[MTR: 10.4 Pairing Algorithm](https://media.wizards.com/ContentResources/WPN/MTG_MTR_2026_Feb27_EN.pdf#page=44)

The MTR specifies tournament policy, but does not fully define the Swiss pairing procedure. OfflineLink’s pairing choices are described below; identical pairings to EventLink are not guaranteed.

### Number of rounds

[MTR: Appendix E—Recommended Number of Rounds in Swiss Tournaments](https://media.wizards.com/ContentResources/WPN/MTG_MTR_2026_Feb27_EN.pdf#page=55)

OfflineLink’s default number of Swiss rounds:

| Players | Rounds |
| ------- | -----: |
| 2       |      1 |
| 3–4     |      2 |
| 5–8     |      3 |
| 9–32    |      5 |
| 33–64   |      6 |
| 65–128  |      7 |
| 129–226 |      8 |
| 227–409 |      9 |
| 410+    |     10 |

These are the app’s defaults rather than an exact reproduction of Appendix E. The MTR specifies single elimination for 5–8 players and 4 Swiss rounds for 9–16 players in Limited events with a Booster Draft playoff. Playoff rounds are separate from the Swiss round count. The app’s calculation uses the player count without adjustments for awarded byes.

### First round

First-round pairings and bye selection are random.

### Following rounds

- Before the final round, pairings favor small match-point differences. Standings order can influence the choice between equally good pairings.
- Rematches are avoided whenever complete pairings without them are possible. Otherwise, the tournament continues with the fewest rematches possible.
- With an odd number of active players, prefer bye recipients with the fewest previous byes, then lowest standing, subject to minimizing rematches.

### Final round

- Pair players in standings order, preferring the highest-ranked available opponent while avoiding rematches and preserving valid pairings for everyone else.
- If rematches are unavoidable, minimize rematches and apply the bye preference, then pair in standings order. Try fresh opponents first, followed by previous opponents, choosing the highest-ranked opponent who preserves the minimum rematch count. This fallback is OfflineLink’s policy.
- Bye selection follows the same rules as previous rounds.

The final-round rank preference follows Wizards’ [EventLink power-pairing description](https://wpn.wizards.com/en/news/eventlink-release-notes-september-28-2021). That description does not specify what to do when rematches are unavoidable.

### Tiebreaks

[MTR: 3.1 Tiebreakers](https://media.wizards.com/ContentResources/WPN/MTG_MTR_2026_Feb27_EN.pdf#page=15)\
[MTR: Appendix C—Tiebreaker Explanation](https://media.wizards.com/ContentResources/WPN/MTG_MTR_2026_Feb27_EN.pdf#page=51)

Players are ranked using the following criteria, in order:

1. Match points
2. Opponents’ match-win percentage
3. Game-win percentage
4. Opponents’ game-win percentage

## Developer tools

Press `F12` to open or hide the developer tools.
