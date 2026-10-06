import type { OfflineLinkApi } from "../../api.ts";

declare global {
    interface Window {
        api: OfflineLinkApi;
    }
}
