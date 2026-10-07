import type { Round } from "../../../common/models";

export function hasReceivedBye(playerId: number, rounds: Round[]): boolean {
    return rounds.some((round) =>
        round.pairings.some(
            (pairing) =>
                pairing.type === "BYE" && pairing.playerId === playerId,
        ),
    );
}
