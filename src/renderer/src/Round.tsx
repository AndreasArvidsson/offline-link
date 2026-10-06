import { useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import type {
    MatchResult,
    PairingBye,
    PairingMatch,
    Player,
    Round,
} from "../../common/models";

interface Props {
    disabled: boolean;
    round: Round;
    players: Player[];
    onChange: (rounds: Round) => void;
}

interface SelectedMatch {
    id: string;
    scores: number[];
}

export function RoundComponent({
    disabled,
    round,
    players,
    onChange,
}: Props): JSX.Element {
    const [selectedMatch, setSelectedMatch] = useState<SelectedMatch>();
    const matches = round.pairings.filter((p) => p.type === "MATCH");
    const countResult = matches.filter((p) => p.result != null).length;
    const byes = round.pairings.filter((p) => p.type === "BYE");

    const playerName = (id: number): string => {
        return players.find((p) => p.id === id)?.name ?? "Unknown player";
    };

    const matchOnKey = (selected: SelectedMatch, key: string) => {
        switch (key) {
            case "0":
            case "1":
            case "2": {
                const score = Number(key);
                const scores =
                    selected.scores.length === 3
                        ? [score]
                        : [...selected.scores, score];
                setSelectedMatch({ id: selected.id, scores });
                break;
            }
            case "Enter": {
                if (selected.scores.length > 1) {
                    const result = selectedToResults(selected);
                    if (isMatchResultValid(result)) {
                        onChange({
                            ...round,
                            pairings: round.pairings.map((p) =>
                                p.id === selected.id ? { ...p, result } : p,
                            ),
                        });
                        setSelectedMatch(undefined);
                    }
                }
                break;
            }
            case "Escape": {
                setSelectedMatch(undefined);
                break;
            }
            default:
                break;
        }
    };

    const renderMatch = (match: PairingMatch) => {
        if (selectedMatch?.id === match.id && !disabled) {
            return (
                <tr
                    autoFocus
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
                <td>-</td>
                <td>{playerName(bye.playerId)}</td>
                <td>BYE</td>
                <td>-</td>
            </tr>
        );
    };

    return (
        <>
            <div>
                <span>Round {round.number}</span>
                <span className="float-end">
                    {countResult} / {matches.length} reported
                </span>
            </div>

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
        </>
    );
}

function getResultString(result: MatchResult | undefined): string {
    return getResultStringHelper(
        result?.player1Wins,
        result?.player2Wins,
        result?.draws,
    );
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
            return getResultStringHelper(
                result.scores[0],
                result.scores[1],
                result.scores[2],
            );
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
        if (draws != null && draws > 0) {
            return `[ ${player1Wins} ] [ ${player2Wins} ] (${draws} draw)`;
        }
        return `[ ${player1Wins} ] [ ${player2Wins} ]`;
    }
    if (player1Wins != null) {
        return `[ ${player1Wins} ] [   ]`.replaceAll(" ", "\u00A0");
    }
    return "[   ] [   ]".replaceAll(" ", "\u00A0");
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
    return result.player1Wins + result.player2Wins + result.draws < 4;
}
