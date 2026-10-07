import path from "node:path";
import { nativeTheme, BrowserWindow } from "electron";
import { APP_NAME } from "./common/constants";

const iconPath = path.resolve(__dirname, "..", "images", "icon.png");

export function createWindow(): BrowserWindow {
    nativeTheme.themeSource = "system";

    const window = new BrowserWindow({
        title: APP_NAME,
        icon: iconPath,

        center: true,
        width: 1120,
        height: 820,
        minWidth: 760,
        minHeight: 600,

        webPreferences: {
            preload: path.resolve(__dirname, "preload.js"),
        },
    });

    window.removeMenu();

    // Set by electron-vite dev
    // oxlint-disable-next-line node/no-process-env
    const devUrl = process.env.ELECTRON_RENDERER_URL;

    // DEV: served from Vite dev server (no files on disk)
    if (devUrl != null) {
        void window.loadURL(devUrl);
    }
    // PROD: load the built HTML from disk
    else {
        void window.loadFile(path.resolve(__dirname, "index.html"));
    }

    // window.webContents.openDevTools();

    return window;
}
