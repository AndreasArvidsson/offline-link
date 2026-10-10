import type { Round } from "../../common/models";

export function getHighestPairingId(rounds: Round[]): number {
    let highest = 0;

    for (const round of rounds) {
        for (const pairing of round.pairings) {
            highest = Math.max(highest, pairing.id);
        }
    }

    return highest;
}
