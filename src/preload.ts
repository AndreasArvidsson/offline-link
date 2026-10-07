import { contextBridge, ipcRenderer } from "electron";
import type { OfflineLinkApi } from "./api.ts";
import { channels } from "./api.ts";

const api: OfflineLinkApi = {
    getParameters: () => ipcRenderer.invoke(channels.getParameters),
    getRecentTournaments: () =>
        ipcRenderer.invoke(channels.getRecentTournaments),
    getTournament: (id: string) =>
        ipcRenderer.invoke(channels.getTournament, id),
    saveTournament: (tournament) =>
        ipcRenderer.invoke(channels.saveTournament, tournament),
    toggleDevTools: () => ipcRenderer.invoke(channels.toggleDevTools),
};

contextBridge.exposeInMainWorld("api", api);
