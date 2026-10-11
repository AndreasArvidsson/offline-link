import type { TournamentStatus } from "../../common/models";

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
