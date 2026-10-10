import assert from "node:assert/strict";
import { describe, it } from "mocha";
import { formatMatchResult } from "../renderer/utils/formatMatchResult.ts";

describe("formatMatchResult", () => {
    it("labels a reported 0-0-0 result as a double match loss", () => {
        assert.equal(
            formatMatchResult({ player1Wins: 0, player2Wins: 0, draws: 0 }),
            "Double match loss",
        );
    });

    it("distinguishes actual and intentional game draws from double losses", () => {
        assert.equal(
            formatMatchResult({ player1Wins: 0, player2Wins: 0, draws: 1 }),
            "0-0-1",
        );
        assert.equal(
            formatMatchResult({ player1Wins: 0, player2Wins: 0, draws: 3 }),
            "0-0-3",
        );
        assert.equal(
            formatMatchResult({ player1Wins: 1, player2Wins: 1, draws: 0 }),
            "1-1",
        );
    });

    it("preserves the score and game draws of ordinary match results", () => {
        assert.equal(
            formatMatchResult({ player1Wins: 2, player2Wins: 0, draws: 0 }),
            "2-0",
        );
        assert.equal(
            formatMatchResult({ player1Wins: 1, player2Wins: 2, draws: 1 }),
            "1-2-1",
        );
    });
});
