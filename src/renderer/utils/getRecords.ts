import type {
    MatchResult,
    PlayerRecord,
    Tournament,
} from "../../common/models";
import { isDoubleMatchLoss } from "./isDoubleMatchLoss";

const MINIMUM_WIN_PERCENTAGE = 0.33;

interface Records {
    get: (playerId: number) => PlayerRecord;
}

interface TemporaryRecord {
    opponentIds: number[];
    matchWins: number;
    matchLosses: number;
    matchDraws: number;
    gameWins: number;
    gameLosses: number;
    gameDraws: number;
}

export function getRecords(tournament: Tournament): Records {
    const totals = new Map<number, TemporaryRecord>();

    for (const player of tournament.players) {
        totals.set(player.id, {
            opponentIds: [],
            matchWins: 0,
            matchLosses: 0,
            matchDraws: 0,
            gameWins: 0,
            gameLosses: 0,
            gameDraws: 0,
        });
    }

    const getRecord = (playerId: number): TemporaryRecord => {
        const record = totals.get(playerId);
        if (record == null) {
            throw new Error(`Missing temporary record for player ${playerId}`);
        }
        return record;
    };

    for (const round of tournament.rounds) {
        if (round.status !== "COMPLETED") {
            continue;
        }

        for (const pairing of round.pairings) {
            if (pairing.type === "BYE") {
                const record = getRecord(pairing.playerId);
                record.matchWins++;
                record.gameWins += 2;
                continue;
            }

            if (pairing.result == null) {
                continue;
            }

            addMatch(
                getRecord(pairing.player1Id),
                pairing.player2Id,
                pairing.result,
                true,
            );

            addMatch(
                getRecord(pairing.player2Id),
                pairing.player1Id,
                pairing.result,
                false,
            );
        }
    }

    const records = new Map<number, PlayerRecord>();

    for (const [playerId, record] of totals) {
        records.set(playerId, finalizeRecord(record));
    }

    return {
        get: (playerId) => {
            const record = records.get(playerId);
            if (record == null) {
                throw new Error(`Missing record for player ${playerId}`);
            }
            return record;
        },
    };
}

function addMatch(
    record: TemporaryRecord,
    opponentId: number,
    result: MatchResult,
    isPlayer1: boolean,
): void {
    const ownWins = isPlayer1 ? result.player1Wins : result.player2Wins;
    const opponentWins = isPlayer1 ? result.player2Wins : result.player1Wins;

    record.opponentIds.push(opponentId);
    record.gameWins += ownWins;
    record.gameLosses += opponentWins;
    record.gameDraws += result.draws;

    if (isDoubleMatchLoss(result)) {
        record.matchLosses++;
    } else if (ownWins > opponentWins) {
        record.matchWins++;
    } else if (ownWins < opponentWins) {
        record.matchLosses++;
    } else {
        record.matchDraws++;
    }
}

function finalizeRecord(record: TemporaryRecord): PlayerRecord {
    const matchPoints = record.matchWins * 3 + record.matchDraws;
    const matchesPlayed =
        record.matchWins + record.matchLosses + record.matchDraws;
    const gamesPlayed = record.gameWins + record.gameLosses + record.gameDraws;
    const gamePoints = record.gameWins * 3 + record.gameDraws;

    return {
        matchWins: record.matchWins,
        matchLosses: record.matchLosses,
        matchDraws: record.matchDraws,
        opponentIds: record.opponentIds,
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
