import type { JSX } from "preact";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { NA } from "../common/constants";
import type {
    MatchResult,
    PairingBye,
    PairingMatch,
    ParticipationType,
    Player,
    PlayerParticipationChange,
    PlayerRecord,
    Round,
} from "../common/models";
import { Button } from "./components/Button";
import { IconParticipationChange } from "./components/IconParticipationChange";
import { MatchScoreBoxes } from "./components/MatchScoreBoxes";
import { PlayersDropped } from "./PlayersDropped";
import { classNames } from "./utils/classNames";
import { formatMatchResult } from "./utils/formatMatchResult";
import { formatPlayerRecord } from "./utils/formatRecord";
import { Lookup } from "./utils/Lookup";

interface Props {
    disabled: boolean;
    round: Round;
    players: Player[];
    playerRecords: Lookup<number, PlayerRecord>;
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
    playerRecords,
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

    const renderPlayer = (playerId: number) => {
        const record = playerRecords.get(playerId);
        return (
            <span>
                {playerName(playerId)}
                <div className="player-record">
                    {formatPlayerRecord(record)}
                </div>
            </span>
        );
    };

    const renderMatch = (match: PairingMatch) => {
        const isSelectedMatch = selectedMatch?.id === match.id;

        if (isSelectedMatch && !disabled) {
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
                    <td className="table-number">{match.table}</td>
                    <td className="player-1">
                        {renderPlayer(match.player1Id)}
                    </td>
                    <td className="match-results">
                        {getSelectedResult(selectedMatch)}
                    </td>
                    <td>{renderPlayer(match.player2Id)}</td>
                </tr>
            );
        }

        return (
            <tr
                key={match.id}
                className={isSelectedMatch ? "table-primary" : undefined}
            >
                <td className="table-number">{match.table}</td>
                <td className="player-1">{renderPlayer(match.player1Id)}</td>
                <td
                    className={classNames(
                        "match-results",
                        !disabled && "pointer",
                    )}
                    onClick={
                        disabled
                            ? undefined
                            : () => setSelectedMatch(matchToSelected(match))
                    }
                >
                    {getResult(match.result)}
                </td>
                <td>{renderPlayer(match.player2Id)}</td>
            </tr>
        );
    };

    const renderBye = (bye: PairingBye) => {
        return (
            <tr key={bye.id}>
                <td className="table-number">{NA}</td>
                <td className="player-1">{renderPlayer(bye.playerId)}</td>
                <td className="match-results">BYE</td>
                <td>{NA}</td>
            </tr>
        );
    };

    return (
        <>
            <p>
                {countResult} / {matches.length} reported
            </p>

            <table className="table table-striped round-pairings">
                <thead>
                    <tr>
                        <th className="table-number">Table</th>
                        <th className="player-1">Player #1</th>
                        <th className="match-results">Match results</th>
                        <th>Player #2</th>
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

function getResult(result: MatchResult | undefined): string | JSX.Element {
    return result == null ? (
        <MatchScoreBoxes player1Wins={undefined} player2Wins={undefined} />
    ) : (
        formatMatchResult(result)
    );
}

function getSelectedResult(result: SelectedMatch): string | JSX.Element {
    const { scores } = result;
    switch (scores.length) {
        case 0:
        case 1:
        case 2:
            return (
                <MatchScoreBoxes
                    player1Wins={scores[0]}
                    player2Wins={scores[1]}
                />
            );
        case 3:
            return getResult(selectedToResults(result));
        default: {
            throw new Error("Unhandled case");
        }
    }
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
