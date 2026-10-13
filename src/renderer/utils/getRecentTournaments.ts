import type { RecentTournament } from "../../api";

export async function getRecentTournaments(): Promise<RecentTournament[]> {
    const list = await window.api.getRecentTournaments();

    list.sort(
        (a, b) =>
            // Prioritize tournaments that are in progress
            Number(b.status === "IN_PROGRESS") -
                Number(a.status === "IN_PROGRESS") ||
            // Then sort by most recently updated
            b.updatedAt - a.updatedAt,
    );

    return list;
}
