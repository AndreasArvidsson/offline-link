import type { PlayerRecord, Round } from "../../common/models";
import { isDoubleMatchLoss } from "./isDoubleMatchLoss";

const MINIMUM_WIN_PERCENTAGE = 0.33;

export function calculateRecord(
    playerId: number,
    rounds: Round[],
): PlayerRecord {
    const opponentIds: number[] = [];
    let matchWins = 0;
    let matchLosses = 0;
    let matchDraws = 0;
    let gameWins = 0;
    let gameLosses = 0;
    let gameDraws = 0;

    for (const round of rounds) {
        if (round.status !== "COMPLETED") {
            continue;
        }

        for (const pairing of round.pairings) {
            if (pairing.type === "BYE") {
                if (pairing.playerId === playerId) {
                    matchWins++;
                    gameWins += 2;
                }
                continue;
            }

            if (
                pairing.result == null ||
                (pairing.player1Id !== playerId &&
                    pairing.player2Id !== playerId)
            ) {
                continue;
            }

            const isPlayer1 = pairing.player1Id === playerId;
            const ownWins = isPlayer1
                ? pairing.result.player1Wins
                : pairing.result.player2Wins;
            const opponentWins = isPlayer1
                ? pairing.result.player2Wins
                : pairing.result.player1Wins;

            opponentIds.push(isPlayer1 ? pairing.player2Id : pairing.player1Id);

            gameWins += ownWins;
            gameLosses += opponentWins;
            gameDraws += pairing.result.draws;

            if (isDoubleMatchLoss(pairing.result)) {
                matchLosses++;
            } else if (ownWins > opponentWins) {
                matchWins++;
            } else if (ownWins < opponentWins) {
                matchLosses++;
            } else {
                matchDraws++;
            }
        }
    }

    const matchPoints = matchWins * 3 + matchDraws;
    const matchesPlayed = matchWins + matchLosses + matchDraws;
    const gamesPlayed = gameWins + gameLosses + gameDraws;
    const gamePoints = gameWins * 3 + gameDraws;

    return {
        matchWins,
        matchLosses,
        matchDraws,
        opponentIds,
        matchPoints,
        matchWinPercentage: calculateWinPercentage(matchPoints, matchesPlayed),
        gameWinPercentage: calculateWinPercentage(gamePoints, gamesPlayed),
    };
}

function calculateWinPercentage(points: number, count: number): number {
    if (count === 0) {
        return MINIMUM_WIN_PERCENTAGE;
    }

    const percentage = points / (count * 3);
    return Math.max(MINIMUM_WIN_PERCENTAGE, percentage);
}
