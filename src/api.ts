import type { Tournament } from "./tournament/models.ts";
import type { TournamentCommand } from "./tournament/tournament.ts";

export interface OpenTournament {
    sessionId: string;
    filePath: string;
    tournament: Tournament;
}

export interface RecentTournament {
    filePath: string;
    name: string;
    updatedAt: string;
    playerCount: number;
    roundCount: number;
    status: Tournament["status"];
}

export interface HomeState {
    recent: RecentTournament[];
    issues: { filePath: string; message: string }[];
}

export type ApiResult<T> =
    | { ok: true; value: T }
    | { ok: false; error: string };

export interface OfflineLinkApi {
    home: () => Promise<ApiResult<HomeState>>;
    create: (input: {
        name: string;
        players: string[];
    }) => Promise<ApiResult<OpenTournament>>;
    openRecent: (filePath: string) => Promise<ApiResult<OpenTournament>>;
    openFile: () => Promise<ApiResult<OpenTournament | null>>;
    change: (
        sessionId: string,
        command: TournamentCommand,
    ) => Promise<ApiResult<OpenTournament>>;
    reload: (sessionId: string) => Promise<ApiResult<OpenTournament>>;
    reveal: (sessionId: string) => Promise<ApiResult<null>>;
}

export const channels = {
    home: "offlinelink:home",
    create: "offlinelink:create",
    openRecent: "offlinelink:open-recent",
    openFile: "offlinelink:open-file",
    change: "offlinelink:change",
    reload: "offlinelink:reload",
    reveal: "offlinelink:reveal",
} as const;
