import assert from "node:assert/strict";
import { describe, it } from "mocha";
import type { Player } from "../common/models.ts";
import { generateFirstRound } from "../renderer/src/utils/generateFirstRound.ts";

describe("generateFirstRound", () => {
    it("pairs every entrant exactly once and gives a bye only to odd fields", () => {
        for (const playerCount of [0, 1, 2, 5, 8]) {
            const players = Array.from({ length: playerCount }, (_, index) => ({
                id: index + 1,
                name: `Player ${index + 1}`,
            }));
            const round = generateFirstRound(players, () => 0.5);
            const pairedPlayerIds = round.pairings.flatMap((pairing) =>
                pairing.type === "MATCH"
                    ? [pairing.player1Id, pairing.player2Id]
                    : [pairing.playerId],
            );

            assert.deepEqual(
                pairedPlayerIds.toSorted((a, b) => a - b),
                players.map((player) => player.id),
            );
            assert.equal(
                round.pairings.filter((pairing) => pairing.type === "BYE")
                    .length,
                playerCount % 2,
            );
            assert.equal(
                round.pairings.filter((pairing) => pairing.type === "MATCH")
                    .length,
                Math.floor(playerCount / 2),
            );
        }
    });

    it("assigns consecutive numeric IDs to matches and a bye without changing players", () => {
        const players: Player[] = [
            { id: 1, name: "Player 1" },
            { id: 2, name: "Player 2" },
            { id: 3, name: "Player 3" },
            { id: 4, name: "Player 4" },
            { id: 5, name: "Player 5" },
        ];
        const before = structuredClone(players);

        const round = generateFirstRound(players, () => 0);

        assert.deepEqual(
            round.pairings.map((pairing) => pairing.id),
            [1, 2, 3],
        );
        assert.deepEqual(
            round.pairings.map((pairing) => pairing.type),
            ["MATCH", "MATCH", "BYE"],
        );
        assert.deepEqual(players, before);
    });
});
