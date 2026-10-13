import type {
    TournamentStatus,
    PairingMethod,
    GameWinsPerMatch,
} from "../../common/models";

export function statusToString(status: TournamentStatus): string {
    switch (status) {
        case "NOT_STARTED":
            return "Not started";
        case "IN_PROGRESS":
            return "In progress";
        case "COMPLETED":
            return "Completed";
        default: {
            const _exhaustiveCheck: never = status;
            throw new Error("Unhandled status");
        }
    }
}

export function gameWinsPerMatchToString(gameWins: GameWinsPerMatch): string {
    switch (gameWins) {
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        case "BO3":
            return "Best of 3";
        default: {
            const _exhaustiveCheck: never = gameWins;
            throw new Error("Unhandled game wins type");
        }
    }
}

export function pairingMethodToTitle(method: PairingMethod): string {
    switch (method) {
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        case "SWISS":
            return "Swiss";
        default: {
            const _exhaustiveCheck: never = method;
            throw new Error("Unhandled pairing method");
        }
    }
}

export function pairingMethodToDescription(method: PairingMethod): string {
    switch (method) {
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        case "SWISS":
            return "Swiss-system pairings";
        default: {
            const _exhaustiveCheck: never = method;
            throw new Error("Unhandled pairing method");
        }
    }
}
