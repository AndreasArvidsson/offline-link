import { app, ipcMain } from "electron";
import type { Parameters } from "./api.ts";
import { channels } from "./api.ts";
import { APP_ID } from "./common/constants.ts";
import type { Tournament } from "./common/models.ts";
import { createWindow } from "./createWindow.ts";
import { getRecentTournaments } from "./getRecentTournaments.ts";
import { getTournament } from "./getTournament.ts";
import { storage } from "./storage.ts";
import { isWindows } from "./util/isOS.ts";
import { showErrorNotification } from "./util/notifications.ts";

// Ensure single instance of the application
if (!app.requestSingleInstanceLock()) {
    app.quit();
}

if (isWindows) {
    app.setAppUserModelId(APP_ID);
}

// oxlint-disable-next-line unicorn/prefer-top-level-await
void (async () => {
    await app.whenReady();

    try {
        await storage.init();
    } catch (error) {
        showErrorNotification("Failed to initialize storage", error);
    }

    const window = createWindow();

    const parameters: Parameters = {
        locale: app.getSystemLocale(),
    };

    ipcMain.handle(channels.getParameters, () => {
        return parameters;
    });

    ipcMain.handle(channels.getRecentTournaments, () => {
        return getRecentTournaments();
    });

    ipcMain.handle(channels.getTournament, (_, id: string) => {
        return getTournament(id);
    });

    ipcMain.handle(channels.saveTournament, (_, tournament: Tournament) => {
        return storage.saveTournament(tournament);
    });

    ipcMain.handle(channels.toggleDevTools, () => {
        window.webContents.toggleDevTools();
    });
})();
