import type { MatchResult } from "../../../common/models";

export function isDoubleMatchLoss(result: MatchResult): boolean {
    return (
        result.player1Wins === 0 &&
        result.player2Wins === 0 &&
        result.draws === 0
    );
}
