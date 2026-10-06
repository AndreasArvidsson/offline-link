import { contextBridge, ipcRenderer } from "electron";
import type { OfflineLinkApi } from "./api.ts";
import { channels } from "./api.ts";

const api: OfflineLinkApi = {
    home: () => ipcRenderer.invoke(channels.home),
    create: (input) => ipcRenderer.invoke(channels.create, input),
    openRecent: (path) => ipcRenderer.invoke(channels.openRecent, path),
    openFile: () => ipcRenderer.invoke(channels.openFile),
    change: (id, command) => ipcRenderer.invoke(channels.change, id, command),
    reload: (id) => ipcRenderer.invoke(channels.reload, id),
    reveal: (id) => ipcRenderer.invoke(channels.reveal, id),
};

contextBridge.exposeInMainWorld("api", api);
