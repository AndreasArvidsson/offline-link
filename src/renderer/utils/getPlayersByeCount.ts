import type { Round } from "../../common/models";

export function getPlayersByeCount(rounds: Round[]): Map<number, number> {
    const result = new Map<number, number>();

    for (const round of rounds) {
        for (const pairing of round.pairings) {
            if (pairing.type === "BYE") {
                result.set(
                    pairing.playerId,
                    (result.get(pairing.playerId) ?? 0) + 1,
                );
            }
        }
    }

    return result;
}
