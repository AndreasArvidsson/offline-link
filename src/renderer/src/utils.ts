import type { TournamentStatus } from "../../tournament/models";

export function statusToString(status: TournamentStatus): string {
    switch (status) {
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

export function isEmptyString(value: string): boolean {
    return value.trim() === "";
}
