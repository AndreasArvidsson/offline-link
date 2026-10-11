import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { Round, Timer } from "../common/models";
import { Popover } from "./components/Popover";
import "./Timer.css";
import { DEFAULT_DURATION, TimerModal } from "./TimerModal";
import { classNames } from "./utils/classNames";
import {
    formatTimerDuration,
    getTimerStyleClass,
    getTimerSubtitle,
    secondsUntil,
} from "./utils/timerUtils";

interface Props {
    timer: Timer | undefined;
    rounds: Round[];
    onChange: (timer: Timer | undefined) => void;
}

const stoppedTimer: Timer = {
    type: "STOPPED",
    duration: DEFAULT_DURATION,
};

export function TimerComponent({
    timer = stoppedTimer,
    rounds,
    onChange,
}: Props): JSX.Element {
    const [remaining, setRemaining] = useState(timer.duration);
    const roundNumber =
        rounds.length > 0 ? rounds[rounds.length - 1].number : 1;

    useEffect(() => {
        if (timer.type === "STOPPED") {
            setRemaining(timer.duration);
            return undefined;
        }
        if (timer.type === "PAUSED") {
            setRemaining(timer.remaining);
            return undefined;
        }

        const { endsAt } = timer;

        setRemaining(secondsUntil(endsAt));

        const interval = window.setInterval(() => {
            setRemaining(secondsUntil(endsAt));
        }, 250);

        return () => window.clearInterval(interval);
    }, [timer.type, timer.duration]);

    const start = (dur: number) => {
        if (timer.type !== "STOPPED") {
            throw new Error(`Cannot start a timer that is not stopped.`);
        }
        onChange({
            type: "RUNNING",
            duration: dur,
            endsAt: Date.now() + dur * 1000,
        });
    };

    const resume = () => {
        if (timer.type !== "PAUSED") {
            throw new Error(`Cannot resume a timer that is not paused.`);
        }
        onChange({
            type: "RUNNING",
            duration: timer.duration,
            endsAt: Date.now() + timer.remaining * 1000,
        });
    };

    const stop = () => {
        if (timer.type === "STOPPED") {
            throw new Error(`Cannot stop a timer that is already stopped.`);
        }
        onChange({
            type: "STOPPED",
            duration: timer.duration,
        });
    };

    const pause = () => {
        if (timer.type !== "RUNNING") {
            throw new Error(`Cannot pause a timer that is not running.`);
        }
        onChange({
            type: "PAUSED",
            duration: timer.duration,
            remaining: secondsUntil(timer.endsAt),
        });
    };

    const save = (dur: number) => {
        if (timer.type !== "STOPPED") {
            throw new Error(`Cannot save a timer that is not stopped.`);
        }
        onChange({
            type: "STOPPED",
            duration: dur,
        });
    };

    const subtitle = getTimerSubtitle(timer, remaining);

    return (
        <Popover
            // oxlint-disable-next-line react/no-unstable-nested-components
            overlay={(hide) => (
                <TimerModal
                    timer={timer}
                    remaining={remaining}
                    start={start}
                    pause={pause}
                    resume={resume}
                    stop={stop}
                    cancel={hide}
                    save={(dur) => {
                        save(dur);
                        hide();
                    }}
                />
            )}
        >
            <div
                className={classNames(
                    "timer-duration pointer float-end",
                    getTimerStyleClass(timer, remaining),
                )}
            >
                {formatTimerDuration(remaining)}
                <div className="timer-duration-sub">
                    Round {roundNumber}
                    {subtitle != null && ` · ${subtitle}`}
                </div>
            </div>
        </Popover>
    );
}
