import assert from "node:assert/strict";
import { describe, it } from "mocha";
import type { PlayerStanding } from "../common/models.ts";
import { findRoundPairing } from "../renderer/utils/findRoundPairing.ts";
import type { HavePlayed } from "../renderer/utils/getHavePlayed.ts";

function standings(matchPoints: number[]): PlayerStanding[] {
    return matchPoints.map((points, index) => ({
        rank: index + 1,
        player: { id: index + 1, name: `Player ${index + 1}` },
        byeCount: 0,
        matchPoints: points,
        matchWins: Math.floor(points / 3),
        matchLosses: 0,
        matchDraws: points % 3,
        opponentsMatchWinPercentage: 0,
        gameWinPercentage: 0,
        opponentsGameWinPercentage: 0,
    }));
}

function opponentKey(first: number, second: number): string {
    return `${Math.min(first, second)}-${Math.max(first, second)}`;
}

describe("findRoundPairing", () => {
    it("uses different ordinary and final pairings with distinct points when avoiding a rematch", () => {
        const players = standings([6, 5, 4, 3, 1, 0]);
        const previousPairs = new Set(["3-4"]);
        const havePlayed: HavePlayed = (first, second) =>
            previousPairs.has(opponentKey(first, second));

        // Ordinary rounds sacrifice 1-2 to get gaps 2, 2, 1 across the field.
        assert.deepEqual(findRoundPairing(players, havePlayed, false), {
            bye: undefined,
            matches: [
                [1, 3],
                [2, 4],
                [5, 6],
            ],
        });
        // The final round prioritizes 1-2, leaving gaps 1, 3, 3.
        assert.deepEqual(findRoundPairing(players, havePlayed, true), {
            bye: undefined,
            matches: [
                [1, 2],
                [3, 5],
                [4, 6],
            ],
        });
    });

    it("prefers a smaller maximum point gap even when the total gap is larger", () => {
        const players = standings([6, 5, 4, 3, 2, 0]);
        const freshPairs = new Set(["1-5", "2-4", "3-6", "1-6", "2-3", "4-5"]);
        const havePlayed: HavePlayed = (first, second) =>
            !freshPairs.has(opponentKey(first, second));

        // These are the only two complete fresh pairings:
        // 1-5, 2-4, 3-6: gaps 4, 2, 4; maximum 4, total 10.
        // 1-6, 2-3, 4-5: gaps 6, 1, 1; maximum 6, total 8.
        assert.deepEqual(findRoundPairing(players, havePlayed, false), {
            bye: undefined,
            matches: [
                [1, 5],
                [2, 4],
                [3, 6],
            ],
        });
    });
});
