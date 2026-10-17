import path from "node:path";
import { packager } from "@electron/packager";
import { APP_ID } from "../src/common/constants";

const __dirname = import.meta.dirname;

console.log("Packaging...");

await packager({
    dir: path.join(__dirname, ".."),
    out: "dist",
    overwrite: true,
    icon: "images/icon",
    appBundleId: APP_ID,
    // Use ad-hoc code signing for macOS
    osxSign: {
        identity: "-",
    },
    ignore: [
        // Include whitelisted files and directories only
        whitelistToIgnore(["out", "node_modules", "package.json", "LICENSE"]),
        // Ignore source map files inside whitelisted directories
        ".map$",
    ],
});

function whitelistToIgnore(whitelist: string[]): string {
    return `^/(?!(${whitelist.join("|")}))`;
}
