import type { Round } from "../../common/models";

export type HavePlayed = (player1Id: number, player2Id: number) => boolean;

export function getHavePlayed(rounds: Round[]): HavePlayed {
    const map = new Map<number, Set<number>>();

    for (const round of rounds) {
        for (const pairing of round.pairings) {
            if (pairing.type === "MATCH") {
                if (!map.has(pairing.player1Id)) {
                    map.set(pairing.player1Id, new Set());
                }
                if (!map.has(pairing.player2Id)) {
                    map.set(pairing.player2Id, new Set());
                }
                map.get(pairing.player1Id)?.add(pairing.player2Id);
                map.get(pairing.player2Id)?.add(pairing.player1Id);
            }
        }
    }

    return (player1Id: number, player2Id: number) => {
        return map.get(player1Id)?.has(player2Id) ?? false;
    };
}
