/* oxlint-disable unicorn/max-nested-calls -- Keep scoring fixtures next to their assertions. */
import assert from "node:assert/strict";
import { describe, it } from "mocha";
import type { Pairing, PairingMatch, Round } from "../common/models.ts";
import { calculateMatchPoints } from "../renderer/utils/calculateMatchPoints.ts";

let nextPairingId = 1;

function match(
    player1Id: number,
    player2Id: number,
    player1Wins: number,
    player2Wins: number,
    draws = 0,
): PairingMatch {
    return {
        type: "MATCH",
        id: nextPairingId++,
        table: 1,
        player1Id,
        player2Id,
        result: { player1Wins, player2Wins, draws },
    };
}

function round(
    pairings: Pairing[],
    status: Round["status"] = "COMPLETED",
): Round {
    return {
        number: 1,
        createdAt: 0,
        status,
        participationChanges: [],
        pairings,
    };
}

describe("calculateMatchPoints", () => {
    it("awards both players zero points for a 0-0-0 double match loss", () => {
        const rounds = [round([match(1, 2, 0, 0, 0)])];

        assert.equal(calculateMatchPoints(1, rounds), 0);
        assert.equal(calculateMatchPoints(2, rounds), 0);
    });

    for (const draws of [1, 3]) {
        it(`awards both players one point for a 0-0-${draws} match draw`, () => {
            const rounds = [round([match(1, 2, 0, 0, draws)])];

            assert.equal(calculateMatchPoints(1, rounds), 1);
            assert.equal(calculateMatchPoints(2, rounds), 1);
        });
    }

    it("awards both players one point for a played 1-1-0 match draw", () => {
        const rounds = [round([match(1, 2, 1, 1, 0)])];

        assert.equal(calculateMatchPoints(1, rounds), 1);
        assert.equal(calculateMatchPoints(2, rounds), 1);
    });

    it("accumulates ordinary wins, losses, byes, draws, and double match losses", () => {
        const rounds = [
            round([
                match(1, 2, 2, 0),
                match(3, 4, 0, 2),
                { type: "BYE", id: nextPairingId++, playerId: 5 },
            ]),
            round([
                match(3, 1, 0, 2),
                match(2, 5, 2, 1),
                { type: "BYE", id: nextPairingId++, playerId: 4 },
            ]),
            round([
                match(1, 4, 0, 2),
                match(5, 3, 0, 0, 0),
                { type: "BYE", id: nextPairingId++, playerId: 2 },
            ]),
            round([
                match(1, 5, 1, 1, 0),
                match(2, 4, 0, 2),
                { type: "BYE", id: nextPairingId++, playerId: 3 },
            ]),
        ];

        assert.deepEqual(
            [1, 2, 3, 4, 5].map((playerId) =>
                calculateMatchPoints(playerId, rounds),
            ),
            [7, 6, 3, 12, 4],
        );
        assert.equal(calculateMatchPoints(6, rounds), 0);
    });

    it("ignores missing results and in-progress matches and byes", () => {
        const missing = match(1, 2, 2, 0);
        delete missing.result;
        const rounds = [
            round([missing]),
            round(
                [
                    match(1, 2, 2, 0),
                    { type: "BYE", id: nextPairingId++, playerId: 3 },
                ],
                "IN_PROGRESS",
            ),
        ];

        for (const playerId of [1, 2, 3]) {
            assert.equal(calculateMatchPoints(playerId, rounds), 0);
        }
        assert.equal(calculateMatchPoints(1, []), 0);
    });
});
