import type { Timer } from "../../common/models";

export function splitTimerDuration(duration: number): [number, number] {
    const absolute = Math.floor(Math.abs(duration));
    const minutes = Math.floor(absolute / 60);
    const seconds = absolute % 60;
    return [minutes, seconds];
}

export function getTimerStyleClass(
    timer: Timer,
    remaining: number,
): string | undefined {
    if (timer.type === "RUNNING") {
        if (remaining < 0) {
            return "timer-overtime";
        }
        return "timer-running";
    }
    return undefined;
}

export function getTimerSubtitle(
    timer: Timer,
    remaining: number,
): string | undefined {
    if (timer.type === "PAUSED") {
        return "Paused";
    }
    if (remaining < 0) {
        return "Overtime";
    }
    return undefined;
}

export function formatTimerDuration(duration: number): string {
    const [min, sec] = splitTimerDuration(duration);
    return `${formatNumber(min)}:${formatNumber(sec)}`;
}

function formatNumber(num: number): string {
    return num.toString().padStart(2, "0");
}

export function secondsUntil(
    timestamp: number,
    now: number = Date.now(),
): number {
    return Math.floor((timestamp - now) / 1000);
}
