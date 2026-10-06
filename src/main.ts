import { app } from "electron";
import { APP_ID } from "./constants.ts";
import { createWindow } from "./createWindow.ts";
import { isWindows } from "./util/isOS.ts";

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

    createWindow();

    // function handler(
    //     channel: string,
    //     operation: (...args: unknown[]) => Promise<unknown>,
    // ): void {
    //     ipcMain.removeHandler(channel);
    //     ipcMain.handle(
    //         channel,
    //         async (event: IpcMainInvokeEvent, ...args: unknown[]) => {
    //             return {
    //                 ok: true,
    //                 value: await store.exclusive(() => operation(...args)),
    //             };
    //         },
    //     );
    // }

    // handler(channels.home, () => store.home());
    // handler(channels.chooseDirectory, async () => {
    //     const result = await dialog.showOpenDialog(window, {
    //         title: "Choose Tournament Directory",
    //         properties: ["openDirectory", "createDirectory"],
    //     });
    //     return result.canceled || !result.filePaths[0]
    //         ? store.home()
    //         : store.chooseDirectory(result.filePaths[0]);
    // });
    // handler(channels.create, (input) => {
    //     const request = creationRequest(input);
    //     return store.create(request.name, request.players);
    // });
    // handler(channels.openRecent, (path) =>
    //     store.openRecent(textValue(path, "file path", 32768)),
    // );
    // handler(channels.openFile, async () => {
    //     const result = await dialog.showOpenDialog(window!, {
    //         title: "Open Tournament File",
    //         properties: ["openFile"],
    //         filters: [{ name: "Tournament JSON", extensions: ["json"] }],
    //     });
    //     return result.canceled || !result.filePaths[0]
    //         ? null
    //         : store.open(result.filePaths[0]);
    // });
    // handler(channels.change, (id, command) =>
    //     store.change(textValue(id, "session ID"), commandRequest(command)),
    // );
    // handler(channels.reload, (id) => store.reload(textValue(id, "session ID")));
    // handler(channels.reveal, (id) => {
    //     shell.showItemInFolder(store.sessionPath(textValue(id, "session ID")));
    //     return Promise.resolve();
    // });

    // if (devUrl != null) {
    //     void window.loadURL(devUrl);
    // } else {
    //     void window.loadFile(rendererFile);
    // }

    // app.setName("OfflineLink");
    // void app.whenReady().then(() => {
    //     const store = new TournamentStore(
    //         join(app.getPath("userData"), "settings.json"),
    //     );
    //     createWindow(store);
    //     app.on("activate", () => {
    //         if (!window) {
    //             createWindow(store);
    //         }
    //     });
    // });
})();
