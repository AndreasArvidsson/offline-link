import type { Round } from "../../common/models";

export function havePlayed(
    player1Id: number,
    player2Id: number,
    rounds: Round[],
): boolean {
    return rounds.some((round) =>
        round.pairings.some(
            (pairing) =>
                pairing.type === "MATCH" &&
                ((pairing.player1Id === player1Id &&
                    pairing.player2Id === player2Id) ||
                    (pairing.player1Id === player2Id &&
                        pairing.player2Id === player1Id)),
        ),
    );
}
