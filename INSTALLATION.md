# Installation

1. Download the ZIP file from [GitHub](https://github.com/AndreasArvidsson/offline-link/releases/latest).
    - [Windows](https://github.com/AndreasArvidsson/offline-link/releases/latest/download/OfflineLink-Windows.zip)
    - [Linux](https://github.com/AndreasArvidsson/offline-link/releases/latest/download/OfflineLink-Linux.zip)
    - [macOS](https://github.com/AndreasArvidsson/offline-link/releases/latest/download/OfflineLink-macOS.zip)
2. Extract the ZIP file.
3. Run the OfflineLink executable (e.g. `OfflineLink.exe`).

## Opening OfflineLink on Windows

Windows may show a **Windows protected your PC** warning because Microsoft Defender SmartScreen does not recognize OfflineLink. If you trust the download:

1. Open the extracted application folder and double-click `OfflineLink.exe`.
2. If the **Windows protected your PC** warning appears, click **More info**.
3. Check that the app shown is `OfflineLink.exe`, then click **Run anyway**.

If **Run anyway** is unavailable, your device's security settings may prevent you from allowing the app. On a managed device, contact your administrator. See [Microsoft's SmartScreen documentation](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation) for more information.

## Opening OfflineLink on macOS

OfflineLink is not notarized by Apple, so macOS may block it on first launch. If you trust the download, you can allow OfflineLink using [Apple's instructions](https://support.apple.com/en-au/102445):

1. Try opening `OfflineLink.app` once, then dismiss the warning.
2. Open **System Settings → Privacy & Security**.
3. Scroll down to the message about OfflineLink and click **Open Anyway**.
4. Click **Open** when the confirmation appears.

macOS saves an exception for OfflineLink, so you can open it normally afterward. If macOS reports that the app is damaged or will harm your computer, see the separate guidance for those alerts in Apple's article.

## SHA-256 checksums

Use these checksums to verify that your downloaded ZIP file matches the release.

- [Windows](https://github.com/AndreasArvidsson/offline-link/releases/latest/download/OfflineLink-Windows.zip.sha256)
- [Linux](https://github.com/AndreasArvidsson/offline-link/releases/latest/download/OfflineLink-Linux.zip.sha256)
- [macOS](https://github.com/AndreasArvidsson/offline-link/releases/latest/download/OfflineLink-macOS.zip.sha256)

## Uninstallation

1. Close OfflineLink.
2. Delete the application folder that you extracted from the ZIP file. On macOS, delete `OfflineLink.app` if you moved it to Applications.
3. Keep `Documents/OfflineLink` to preserve your tournaments. To remove your tournament data as well, back up any files you want to keep, then delete this folder.
4. Optionally remove OfflineLink's cache and settings folder:
    - Windows: `%APPDATA%\OfflineLink`.
    - macOS: `~/Library/Application Support/OfflineLink`.
    - Linux: `$XDG_CONFIG_HOME/OfflineLink`, or `~/.config/OfflineLink` if `XDG_CONFIG_HOME` is unset.

The Documents folder may be redirected by your operating system. Deleting the application or its cache does not delete your tournaments.
