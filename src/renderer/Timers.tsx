import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { RecentTournament } from "../api";
import type { Timer } from "../common/models";
import { Button } from "./components/Button";
import type { View } from "./types";
import {
    formatTimerDuration,
    getTimerStyleClass,
    getTimerSubtitle,
    secondsUntil,
} from "./utils/timerUtils";

interface Props {
    tournaments: RecentTournament[];
    navigate: (view: View) => void;
}

interface TournamentWithTimer extends RecentTournament {
    timer: Timer;
}

export function Timers({ tournaments, navigate }: Props): JSX.Element | null {
    const [remaining, setRemaining] = useState<Record<string, number>>({});

    const withTimers = tournaments.filter(hasTimer).toSorted(
        (a, b) =>
            // Sort running timers before non-running timers
            Number(b.timer.type === "RUNNING") -
                Number(a.timer.type === "RUNNING") ||
            // Sort by remaining time for running timers
            remaining[a.id] - remaining[b.id] ||
            // Finally, sort alphabetically by name if all else is equal
            a.name.localeCompare(b.name),
    );

    const updateRemaining = () => {
        const updatedRemaining: Record<string, number> = {};
        const now = Date.now();

        for (const tournament of withTimers) {
            const { timer } = tournament;
            if (timer.type === "STOPPED") {
                continue;
            }
            if (timer.type === "PAUSED") {
                updatedRemaining[tournament.id] = timer.remaining;
                continue;
            }
            updatedRemaining[tournament.id] = secondsUntil(timer.endsAt, now);
        }

        setRemaining(updatedRemaining);
    };

    useEffect(() => {
        if (withTimers.length === 0) {
            return undefined;
        }

        updateRemaining();

        const interval = window.setInterval(updateRemaining, 250);

        return () => window.clearInterval(interval);
    }, [withTimers.length]);

    if (withTimers.length === 0) {
        return null;
    }

    return (
        <>
            <h2>Active Timers</h2>

            {withTimers.map((tournament) => {
                const remainingTime = remaining[tournament.id] ?? 0;
                const subtitle = getTimerSubtitle(
                    tournament.timer,
                    remainingTime,
                );
                return (
                    <div key={tournament.id} className="mb-2">
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                navigate({
                                    type: "tournament",
                                    id: tournament.id,
                                });
                            }}
                        >
                            <strong>{tournament.name}</strong>
                            {" · "}
                            <b>
                                <span
                                    className={getTimerStyleClass(
                                        tournament.timer,
                                        remainingTime,
                                    )}
                                >
                                    {formatTimerDuration(remainingTime)}
                                </span>
                            </b>
                            {subtitle != null && ` · ${subtitle}`}
                        </Button>
                    </div>
                );
            })}
        </>
    );
}

function hasTimer(
    tournament: RecentTournament,
): tournament is TournamentWithTimer {
    return tournament.timer != null && tournament.timer.type !== "STOPPED";
}
