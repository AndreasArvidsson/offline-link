import assert from "node:assert/strict";
import { describe, it } from "mocha";
import { calculateNumberOfRounds } from "../renderer/src/utils/calculateNumberOfRounds.ts";

describe("calculateNumberOfRounds", () => {
    const cases: [number, number][] = [
        [0, 0],
        [1, 0],
        [2, 1],
        [3, 2],
        [4, 2],
        [5, 3],
        [6, 3],
        [7, 3],
        [8, 3],
        [9, 5],
        [32, 5],
        [33, 6],
        [64, 6],
        [65, 7],
        [128, 7],
        [129, 8],
        [226, 8],
        [227, 9],
        [409, 9],
        [410, 10],
    ];

    for (const [playerCount, expectedRounds] of cases) {
        it(`returns ${expectedRounds} rounds for ${playerCount} players`, () => {
            assert.equal(calculateNumberOfRounds(playerCount), expectedRounds);
        });
    }
});
