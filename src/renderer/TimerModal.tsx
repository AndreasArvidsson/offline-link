import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
    CheckLg,
    DashLg,
    Pause,
    Play,
    PlusLg,
    Stop,
    XLg,
} from "react-bootstrap-icons";
import type { Timer } from "../common/models";
import { Button } from "./components/Button";
import { InputNumber } from "./components/InputNumber";
import { ModalBody, ModalContent } from "./components/Modal";
import { classNames } from "./utils/classNames";
import {
    getTimerStyleClass,
    getTimerSubtitle,
    splitTimerDuration,
} from "./utils/timerUtils";

interface Props {
    timer: Timer;
    remaining: number;
    start: (duration: number) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    save: (duration: number) => void;
    cancel: () => void;
}

const DEFAULT_MINUTES = 50;
const DEFAULT_SECONDS = 0;
export const DEFAULT_DURATION = DEFAULT_MINUTES * 60 + DEFAULT_SECONDS;

const MAX_MINUTES = 99;
const MAX_SECONDS = 59;

export function TimerModal({
    timer,
    remaining,
    start,
    pause,
    resume,
    stop,
    save,
    cancel,
}: Props): JSX.Element {
    const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
    const [seconds, setSeconds] = useState(DEFAULT_SECONDS);
    const subtitle = getTimerSubtitle(timer, remaining);
    const disabled = timer.type !== "STOPPED";

    useEffect(() => {
        const [min, sec] = splitTimerDuration(remaining);
        setMinutes(min);
        setSeconds(sec);
    }, [remaining]);

    const renderPlayButton = () => {
        if (timer.type === "STOPPED") {
            return (
                <Button
                    variant="primary"
                    className="timer-toggle"
                    title="Start timer"
                    onClick={() => start(toDuration(minutes, seconds))}
                >
                    <Play />
                </Button>
            );
        }
        if (timer.type === "PAUSED") {
            return (
                <Button
                    variant="primary"
                    className="timer-toggle"
                    title="Resume timer"
                    onClick={resume}
                >
                    <Play />
                </Button>
            );
        }
        return (
            <Button
                variant="primary"
                className="timer-toggle"
                title="Pause timer"
                onClick={pause}
            >
                <Pause />
            </Button>
        );
    };

    const renderSaveStopButton = () => {
        if (timer.type === "STOPPED") {
            return (
                <Button
                    variant="success"
                    title="Save timer settings"
                    onClick={() => save(toDuration(minutes, seconds))}
                >
                    <CheckLg />
                </Button>
            );
        }
        return (
            <Button variant="danger" title="Stop timer" onClick={stop}>
                <Stop />
            </Button>
        );
    };

    return (
        <ModalContent className="timer-modal">
            <ModalBody className="p-3">
                <div className="d-flex gap-3 align-items-center">
                    {renderPlayButton()}

                    <div className="d-flex flex-column gap-3">
                        <div className="d-flex gap-3">
                            <Button
                                variant="primary"
                                title="Increase minutes"
                                disabled={disabled || minutes === MAX_MINUTES}
                                onClick={() => setMinutes(minutes + 1)}
                            >
                                <PlusLg />
                            </Button>
                            <Button
                                variant="primary"
                                title="Increase seconds"
                                disabled={disabled || seconds === MAX_SECONDS}
                                onClick={() => setSeconds(seconds + 1)}
                            >
                                <PlusLg />
                            </Button>
                        </div>

                        <div
                            className={classNames(
                                "timer-duration",
                                getTimerStyleClass(timer, remaining),
                            )}
                        >
                            <div className="timer-duration-inputs">
                                <InputNumber
                                    aria-label="Minutes"
                                    value={minutes}
                                    disabled={disabled}
                                    isInteger
                                    min={0}
                                    max={MAX_MINUTES}
                                    formatValue={formatValue}
                                    onChange={(value) => setMinutes(value ?? 0)}
                                />
                                <span aria-hidden="true">:</span>
                                <InputNumber
                                    aria-label="Seconds"
                                    value={seconds}
                                    disabled={disabled}
                                    isInteger
                                    min={0}
                                    max={MAX_SECONDS}
                                    formatValue={formatValue}
                                    onChange={(value) => setSeconds(value ?? 0)}
                                />
                            </div>
                            {subtitle != null && (
                                <div
                                    className="timer-duration-sub"
                                    aria-hidden="true"
                                >
                                    {subtitle}
                                </div>
                            )}
                        </div>

                        <div className="d-flex gap-3">
                            <Button
                                variant="primary"
                                title="Decrease minutes"
                                disabled={disabled || minutes === 0}
                                onClick={() => setMinutes(minutes - 1)}
                            >
                                <DashLg />
                            </Button>
                            <Button
                                variant="primary"
                                title="Decrease seconds"
                                disabled={disabled || seconds === 0}
                                onClick={() => setSeconds(seconds - 1)}
                            >
                                <DashLg />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="d-flex gap-3 mt-3">
                    <Button
                        variant="secondary"
                        className="timer-cancel"
                        title="Cancel"
                        onClick={cancel}
                    >
                        <XLg />
                    </Button>

                    {renderSaveStopButton()}
                </div>
            </ModalBody>
        </ModalContent>
    );
}

function formatValue(value: number): string {
    return value.toString().padStart(2, "0");
}

function toDuration(minutes: number, seconds: number): number {
    return minutes * 60 + seconds;
}
