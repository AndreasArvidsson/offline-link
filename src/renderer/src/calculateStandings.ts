import type { PlayerStanding, Round, Tournament } from "../../common/models";
import { comparePercentages } from "./comparePercentages";
import { getDroppedPlayers } from "./getDroppedPlayers";

// https://help.mtgo.com/hc/en-us/articles/17114811016219-Tiebreakers-on-MTGO

export function calculateStandings(tournament: Tournament): PlayerStanding[] {
    const droppedPlayerIds = getDroppedPlayers(tournament);
    const records = new Map(
        tournament.players.map((player) => [
            player.id,
            calculateRecord(player.id, tournament.rounds),
        ]),
    );

    return tournament.players
        .map((player): PlayerStanding => {
            const record = records.get(player.id);

            if (record == null) {
                throw new Error(`Missing record for player ${player.id}`);
            }

            let opponentMatchWinPercentage = 0;
            let opponentGameWinPercentage = 0;

            for (const opponentId of record.opponentIds) {
                const opponent = records.get(opponentId);
                if (opponent == null) {
                    throw new Error(
                        `Missing record for opponent ${opponentId}`,
                    );
                }
                opponentMatchWinPercentage += applyPercentageFloor(
                    opponent.matchWinPercentageWithoutByes,
                );
                opponentGameWinPercentage += applyPercentageFloor(
                    opponent.gameWinPercentageWithoutByes,
                );
            }
            if (record.opponentIds.length > 0) {
                opponentMatchWinPercentage /= record.opponentIds.length;
                opponentGameWinPercentage /= record.opponentIds.length;
            }

            return {
                player,
                dropped: droppedPlayerIds.has(player.id),
                matchPoints: record.matchPoints,
                wins: record.wins,
                losses: record.losses,
                draws: record.draws,
                opponentMatchWinPercentage,
                gameWinPercentage: record.gameWinPercentage,
                opponentGameWinPercentage,
            };
        })
        .toSorted(
            (a, b) =>
                b.matchPoints - a.matchPoints ||
                comparePercentages(
                    b.opponentMatchWinPercentage,
                    a.opponentMatchWinPercentage,
                ) ||
                comparePercentages(b.gameWinPercentage, a.gameWinPercentage) ||
                comparePercentages(
                    b.opponentGameWinPercentage,
                    a.opponentGameWinPercentage,
                ),
        );
}

function calculateRecord(playerId: number, rounds: Round[]) {
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let gameWins = 0;
    let gameLosses = 0;
    let gameDraws = 0;
    let byes = 0;
    const opponentIds: number[] = [];

    for (const round of rounds) {
        if (round.status !== "COMPLETED") {
            continue;
        }
        for (const pairing of round.pairings) {
            if (pairing.type === "BYE") {
                if (pairing.playerId === playerId) {
                    byes++;
                    wins++;
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
            if (ownWins > opponentWins) {
                wins++;
            } else if (ownWins < opponentWins) {
                losses++;
            } else {
                draws++;
            }
        }
    }

    const matchPoints = wins * 3 + draws;
    const matchesPlayed = wins + losses + draws;
    const gamesPlayed = gameWins + gameLosses + gameDraws;
    const gamePoints = gameWins * 3 + gameDraws;
    return {
        wins,
        losses,
        draws,
        matchPoints,
        matchWinPercentageWithoutByes: calculateWinPercentage(
            matchPoints - byes * 3,
            matchesPlayed - byes,
        ),
        gameWinPercentage:
            matchesPlayed === 0
                ? 0
                : applyPercentageFloor(
                      calculateWinPercentage(gamePoints, gamesPlayed),
                  ),
        gameWinPercentageWithoutByes: calculateWinPercentage(
            gamePoints - byes * 6,
            gamesPlayed - byes * 2,
        ),
        opponentIds,
    };
}

function calculateWinPercentage(points: number, count: number): number {
    if (count === 0) {
        return 0;
    }

    return points / (count * 3);
}

function applyPercentageFloor(percentage: number): number {
    return Math.max(0.33, percentage);
}
