import type { Pairing, Player, Round } from "../../../common/models";

export function generateFirstRound(
    players: Player[],
    random: () => number = Math.random,
): Round {
    const shuffledPlayers = shuffle(players, random);
    const pairings: Pairing[] = [];

    for (let i = 0; i + 1 < shuffledPlayers.length; i += 2) {
        pairings.push({
            type: "MATCH",
            id: pairings.length + 1,
            table: pairings.length + 1,
            player1Id: shuffledPlayers[i].id,
            player2Id: shuffledPlayers[i + 1].id,
        });
    }

    if (shuffledPlayers.length % 2 !== 0) {
        pairings.push({
            type: "BYE",
            id: pairings.length + 1,
            playerId: shuffledPlayers[shuffledPlayers.length - 1].id,
        });
    }

    return {
        number: 1,
        createdAt: Date.now(),
        status: "IN_PROGRESS",
        droppedPlayerIds: [],
        pairings,
    };
}

function shuffle<T>(values: T[], random: () => number): T[] {
    const result = [...values];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}
