import path from "node:path";
import { packager } from "@electron/packager";

const __dirname = import.meta.dirname;

console.log("Packaging...");

await packager({
    dir: path.join(__dirname, ".."),
    out: "dist",
    overwrite: true,
    appBundleId: "com.github.andreasarvidsson.offline-link",
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
