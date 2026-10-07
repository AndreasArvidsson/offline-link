import assert from "node:assert/strict";
import { describe, it } from "mocha";
import type { Player } from "../common/models.ts";
import { generateFirstRound } from "../renderer/src/utils/generateFirstRound.ts";

describe("generateFirstRound", () => {
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
