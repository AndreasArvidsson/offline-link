import { useLayoutEffect, useRef, useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import { NA } from "../common/constants";
import type {
    MatchResult,
    PairingBye,
    PairingMatch,
    ParticipationType,
    Player,
    PlayerParticipationChange,
    Round,
} from "../common/models";
import { Button } from "./components/Button";
import { IconParticipationChange } from "./components/IconParticipationChange";
import { PlayersDropped } from "./PlayersDropped";
import { formatMatchResult } from "./utils/formatMatchResult";
import { formatRecord } from "./utils/formatRecord";
import { Lookup } from "./utils/Lookup";

interface Props {
    disabled: boolean;
    round: Round;
    players: Player[];
    isLastRound: boolean;
    startNextRound: (() => void) | undefined;
    onChange: (rounds: Round) => void;
}

interface SelectedMatch {
    id: number;
    scores: number[];
}

export function RoundComponent({
    disabled,
    round,
    players,
    isLastRound,
    startNextRound,
    onChange,
}: Props): JSX.Element {
    const [selectedMatch, setSelectedMatch] = useState<SelectedMatch>();
    const selectedMatchRef = useRef<HTMLTableRowElement>(null);

    useLayoutEffect(() => {
        if (!disabled) {
            selectedMatchRef.current?.focus();
        }
    }, [selectedMatch?.id, disabled]);

    const matches = round.pairings.filter((p) => p.type === "MATCH");
    const countResult = matches.filter((p) => p.result != null).length;
    const byes = round.pairings.filter((p) => p.type === "BYE");
    const playersById = new Lookup<number, Player>(
        "Players",
        players.map((player) => [player.id, player]),
    );
    // This is a normal map because it is expected to be sparse with missing player ids.
    const participationByPlayerId = new Map(
        round.participationChanges.map((change) => [
            change.playerId,
            change.type,
        ]),
    );

    const updateRound = (partialRound: Partial<Round>) => {
        onChange({
            ...round,
            ...partialRound,
        });
    };

    const playerName = (id: number): string | JSX.Element => {
        const name = playersById.get(id).name;
        return (
            <>
                {name}{" "}
                <IconParticipationChange
                    type={participationByPlayerId.get(id)}
                />
            </>
        );
    };

    const applySelected = (selected: SelectedMatch) => {
        const result = selectedToResults(selected);
        if (!isMatchResultValid(result)) {
            setSelectedMatch({ id: selected.id, scores: [] });
            return;
        }
        updateRound({
            pairings: round.pairings.map((p) =>
                p.id === selected.id ? { ...p, result } : p,
            ),
        });
        const currentIndex = matches.findIndex((m) => m.id === selected.id);
        const nextIndex = matches.findIndex(
            (m, i) => i > currentIndex && m.result == null,
        );
        if (nextIndex === -1) {
            setSelectedMatch(undefined);
        } else {
            const nextMatch = matches[nextIndex];
            setSelectedMatch(matchToSelected(nextMatch));
        }
    };

    const navigate = (selected: SelectedMatch, direction: "up" | "down") => {
        const currentIndex = matches.findIndex((m) => m.id === selected.id);
        const nextIndex = currentIndex + (direction === "up" ? -1 : 1);
        if (nextIndex >= 0 && nextIndex < matches.length) {
            const nextMatch = matches[nextIndex];
            setSelectedMatch(matchToSelected(nextMatch));
        }
    };

    const matchOnKey = (selected: SelectedMatch, key: string) => {
        switch (key) {
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9": {
                const score = Number(key);
                const scores =
                    selected.scores.length === 3
                        ? [score]
                        : [...selected.scores, score];
                const updatedMatch = { id: selected.id, scores };
                setSelectedMatch(updatedMatch);
                if (scores.length === 3) {
                    applySelected(updatedMatch);
                }
                break;
            }
            case "Enter": {
                if (selected.scores.length > 1) {
                    applySelected(selected);
                }
                break;
            }
            case "Delete": {
                updateRound({
                    pairings: round.pairings.map((p) =>
                        p.id === selected.id ? { ...p, result: undefined } : p,
                    ),
                });
                setSelectedMatch(undefined);
                break;
            }
            case "Escape": {
                setSelectedMatch(undefined);
                break;
            }
            case "ArrowUp":
                navigate(selected, "up");
                break;
            case "ArrowDown":
                navigate(selected, "down");
                break;
            default:
                break;
        }
    };

    const renderMatch = (match: PairingMatch) => {
        if (selectedMatch?.id === match.id && !disabled) {
            return (
                <tr
                    ref={selectedMatchRef}
                    key={match.id}
                    className="selected-match pointer"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        matchOnKey(selectedMatch, e.key);
                        e.preventDefault();
                    }}
                >
                    <td>{match.table}</td>
                    <td>{playerName(match.player1Id)}</td>
                    <td>{getSelectedResultString(selectedMatch)}</td>
                    <td>{playerName(match.player2Id)}</td>
                </tr>
            );
        }

        return (
            <tr
                key={match.id}
                className={
                    selectedMatch?.id === match.id ? "table-primary" : undefined
                }
            >
                <td>{match.table}</td>
                <td>{playerName(match.player1Id)}</td>
                <td
                    className={disabled ? undefined : "pointer"}
                    onClick={
                        disabled
                            ? undefined
                            : () => setSelectedMatch(matchToSelected(match))
                    }
                >
                    {getResultString(match.result)}
                </td>
                <td>{playerName(match.player2Id)}</td>
            </tr>
        );
    };

    const renderBye = (bye: PairingBye) => {
        return (
            <tr key={bye.id}>
                <td>{NA}</td>
                <td>{playerName(bye.playerId)}</td>
                <td>BYE</td>
                <td>{NA}</td>
            </tr>
        );
    };

    return (
        <>
            <p>
                <span>Round {round.number}</span>
                <span className="float-end">
                    {countResult} / {matches.length} reported
                </span>
            </p>

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Table</th>
                        <th>Player 1</th>
                        <th>Result</th>
                        <th>Player 2</th>
                    </tr>
                </thead>
                <tbody>
                    {matches.map(renderMatch)}
                    {byes.map(renderBye)}
                </tbody>
            </table>

            <div className="row mt-4">
                <div className="col">
                    <PlayersDropped
                        disabled={disabled}
                        players={getActivePlayers(players, matches, byes)}
                        participationByPlayerId={participationByPlayerId}
                        onChange={(id, type) => {
                            updateRound({
                                participationChanges:
                                    getUpdatedParticipationChanges(
                                        round.participationChanges,
                                        id,
                                        type,
                                    ),
                            });
                        }}
                    />
                </div>

                <div className="col">
                    <Button
                        variant="success"
                        className="float-end"
                        disabled={disabled || countResult !== matches.length}
                        onClick={startNextRound}
                    >
                        {isLastRound
                            ? "Complete tournament"
                            : `Start round ${round.number + 1}`}
                    </Button>
                </div>
            </div>
        </>
    );
}

function getUpdatedParticipationChanges(
    changes: PlayerParticipationChange[],
    playerId: number,
    type: ParticipationType | undefined,
) {
    const otherChanges = changes.filter(
        (change) => change.playerId !== playerId,
    );
    return type == null ? otherChanges : [...otherChanges, { playerId, type }];
}

function getResultString(result: MatchResult | undefined): string {
    return result == null
        ? getResultStringHelper(undefined, undefined, undefined)
        : formatMatchResult(result);
}

function getSelectedResultString(result: SelectedMatch): string {
    const { scores } = result;
    switch (scores.length) {
        case 0:
            return getResultStringHelper(undefined, undefined, undefined);
        case 1:
            return getResultStringHelper(
                result.scores[0],
                undefined,
                undefined,
            );
        case 2:
            return getResultStringHelper(
                result.scores[0],
                result.scores[1],
                undefined,
            );
        case 3:
            return getResultString(selectedToResults(result));
        default: {
            throw new Error("Unhandled case");
        }
    }
}

function getResultStringHelper(
    player1Wins: number | undefined,
    player2Wins: number | undefined,
    draws: number | undefined,
): string {
    if (player1Wins != null && player2Wins != null) {
        return formatRecord(player1Wins, player2Wins, draws ?? 0);
    }
    if (player1Wins != null) {
        return `${player1Wins} - [   ]`.replaceAll(" ", "\u00A0");
    }
    return "[   ] - [   ]".replaceAll(" ", "\u00A0");
}

function selectedToResults(result: SelectedMatch): MatchResult {
    return {
        player1Wins: result.scores[0] ?? 0,
        player2Wins: result.scores[1] ?? 0,
        draws: result.scores[2] ?? 0,
    };
}

function matchToSelected(match: PairingMatch): SelectedMatch {
    if (match.result == null) {
        return {
            id: match.id,
            scores: [],
        };
    }
    return {
        id: match.id,
        scores: [
            match.result.player1Wins,
            match.result.player2Wins,
            match.result.draws,
        ],
    };
}

function isMatchResultValid(result: MatchResult) {
    // Note: Draws are not counted towards the validity check. Only player1Wins and player2Wins are considered.
    return (
        result.player1Wins < 3 &&
        result.player2Wins < 3 &&
        result.player1Wins + result.player2Wins < 4
    );
}

function getActivePlayers(
    players: Player[],
    matches: PairingMatch[],
    byes: PairingBye[],
) {
    const playerIds = new Set([
        ...matches.flatMap((m) => [m.player1Id, m.player2Id]),
        ...byes.map((b) => b.playerId),
    ]);
    return players.filter((p) => playerIds.has(p.id));
}
