export function calculateNumberOfRounds(playerCount: number): number {
    if (playerCount < 2) {
        throw new Error(`Invalid player count: ${playerCount}`);
    }

    if (playerCount < 9) {
        return Math.ceil(Math.log2(playerCount));
    }

    if (playerCount < 33) {
        return 5;
    }

    if (playerCount < 65) {
        return 6;
    }

    if (playerCount < 129) {
        return 7;
    }

    if (playerCount < 227) {
        return 8;
    }

    if (playerCount < 410) {
        return 9;
    }

    return 10;
}
