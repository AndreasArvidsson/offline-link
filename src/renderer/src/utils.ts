import type { TournamentStatus } from "../../tournament/models";

export function statusToString(status: TournamentStatus): string {
    switch (status) {
        case "IN_PROGRESS":
            return "In Progress";
        case "COMPLETED":
            return "Completed";
        default: {
            const _exhaustiveCheck: never = status;
            throw new Error("Unhandled tournament status");
        }
    }
}
