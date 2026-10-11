import type { Pairing, PartialPairing, Player } from "../../common/models";

export function assignTableNumbers(
    pairings: PartialPairing[],
    players: Player[],
    startingTableNumber: number,
): Pairing[] {
    const lockedTablesByPlayerId = new Map(
        players.map((player) => [player.id, player.lockedTableNumber]),
    );

    const lockedTablePerParing = pairings.map((pairing) => {
        // Keep locked tables reserved during byes so those players can stay seated.
        if (pairing.type === "BYE") {
            return lockedTablesByPlayerId.get(pairing.playerId);
        }

        const table1 = lockedTablesByPlayerId.get(pairing.player1Id);
        const table2 = lockedTablesByPlayerId.get(pairing.player2Id);

        // If both players have locked table numbers, use the lower one.
        // https://wpn.wizards.com/en/news/definitive-guide-wizards-eventlink#tablelocking
        if (table1 != null && table2 != null) {
            return Math.min(table1, table2);
        }

        return table1 ?? table2;
    });

    const reservedTables = new Set(
        lockedTablePerParing.filter((table) => table != null),
    );

    let nextTableNumber = startingTableNumber;

    return pairings.map((pairing, index) => {
        if (pairing.type === "BYE") {
            return pairing;
        }

        const lockedTableNumber = lockedTablePerParing[index];

        // If the pairing has a locked table number, use it.
        if (lockedTableNumber != null) {
            return { ...pairing, table: lockedTableNumber };
        }

        // Otherwise, find the next available table number that is not reserved.
        while (reservedTables.has(nextTableNumber)) {
            nextTableNumber++;
        }

        return { ...pairing, table: nextTableNumber++ };
    });
}
