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
    asar: {
        // Keep native binaries outside app.asar.
        unpack: "**/*.{node,dll,so,dylib}",
    },
    ignore: [
        whitelistToIgnore(["out", "node_modules", "package.json"]),
        ".map$",
    ],
});

function whitelistToIgnore(whitelist: string[]): string {
    return `^/(?!(${whitelist.join("|")}))`;
}
