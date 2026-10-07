import type { MatchResult } from "../../common/models";
import { formatRecord } from "./formatRecord";
import { isDoubleMatchLoss } from "./isDoubleMatchLoss";

export function formatMatchResult(result: MatchResult): string {
    if (isDoubleMatchLoss(result)) {
        return "Double match loss";
    }
    return formatRecord(result.player1Wins, result.player2Wins, result.draws);
}
