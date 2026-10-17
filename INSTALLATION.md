# Installation

1. Download the ZIP file from [GitHub](https://github.com/AndreasArvidsson/offline-link/releases/latest).
    - [Windows](https://github.com/AndreasArvidsson/offline-link/releases/latest/download/OfflineLink-Windows.zip)
    - [Linux](https://github.com/AndreasArvidsson/offline-link/releases/latest/download/OfflineLink-Linux.zip)
    - [macOS](https://github.com/AndreasArvidsson/offline-link/releases/latest/download/OfflineLink-macOS.zip)
2. Extract the ZIP file.
3. Run the OfflineLink executable (e.g. `OfflineLink.exe`).
4. If asked whether you want to run this unrecognized application, choose Run/Continue.

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
