import type { Round } from "../../../common/models";
import { isDoubleMatchLoss } from "./isDoubleMatchLoss";

export function calculateMatchPoints(
    playerId: number,
    rounds: Round[],
): number {
    let points = 0;

    for (const round of rounds) {
        if (round.status === "IN_PROGRESS") {
            continue;
        }

        for (const pairing of round.pairings) {
            if (pairing.type === "BYE") {
                if (pairing.playerId === playerId) {
                    points += 3;
                }

                continue;
            }

            if (pairing.result == null || isDoubleMatchLoss(pairing.result)) {
                continue;
            }

            if (
                pairing.player1Id !== playerId &&
                pairing.player2Id !== playerId
            ) {
                continue;
            }

            const { player1Wins, player2Wins } = pairing.result;

            if (player1Wins === player2Wins) {
                points += 1;
            } else if (
                pairing.player1Id === playerId &&
                player1Wins > player2Wins
            ) {
                points += 3;
            } else if (
                pairing.player2Id === playerId &&
                player2Wins > player1Wins
            ) {
                points += 3;
            }
        }
    }

    return points;
}
