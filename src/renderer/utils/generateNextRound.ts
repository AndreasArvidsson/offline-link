import type { Pairing, Round, Tournament } from "../../common/models";
import { calculateStandings } from "./calculateStandings";
import { findRoundPairing } from "./findRoundPairing";
import { getHavePlayed } from "./getHavePlayed";
import { getHighestPairingId } from "./getHighestPairingId";

export function generateNextRound(tournament: Tournament): Round {
    if (tournament.rounds.length === 0) {
        throw new Error("The first round must be generated separately");
    }
    if (tournament.rounds.length >= tournament.roundCount) {
        throw new Error("All rounds have already been generated");
    }
    if (tournament.rounds.some((round) => round.status !== "COMPLETED")) {
        throw new Error(
            "Complete the current round before generating the next round",
        );
    }

    const players = calculateStandings(tournament).filter(
        (standing) => standing.participationChange == null,
    );
    const roundNumber = tournament.rounds.length + 1;

    const { bye, matches } = findRoundPairing(
        players,
        getHavePlayed(tournament.rounds),
        roundNumber === tournament.roundCount,
    );

    let nextPairingId = getHighestPairingId(tournament.rounds) + 1;

    const pairings: Pairing[] = matches.map(
        ([player1Id, player2Id], index) => ({
            type: "MATCH",
            id: nextPairingId++,
            table: index + 1,
            player1Id,
            player2Id,
        }),
    );

    if (bye != null) {
        pairings.push({
            type: "BYE",
            id: nextPairingId++,
            playerId: bye.player.id,
        });
    } else if (players.length % 2 === 1) {
        throw new Error("Failed to generate a valid pairing with a bye");
    }

    return {
        number: roundNumber,
        createdAt: Date.now(),
        status: "IN_PROGRESS",
        participationChanges: [],
        pairings,
    };
}
