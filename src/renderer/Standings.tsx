import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { NA } from "../common/constants";
import type { PlayerStanding, Tournament } from "../common/models";
import { IconParticipationChange } from "./components/IconParticipationChange";
import { calculateStandings } from "./utils/calculateStandings";
import { formatRecord } from "./utils/formatRecord";

interface Props {
    tournament: Tournament;
}

export function Standings({ tournament }: Props): JSX.Element {
    const [standings, setStandings] = useState<PlayerStanding[]>();

    useEffect(() => {
        setStandings(calculateStandings(tournament));
    }, [tournament]);

    const lastCompletedRound = tournament.rounds.findLast(
        (r) => r.status === "COMPLETED",
    )?.number;

    return (
        <>
            <p>Standings after round {lastCompletedRound ?? NA}</p>

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th
                            title={title(
                                "Match Points: 3 points for a win, 1 point for a draw, 0 points for a loss.",
                                "Higher is better; this is the primary criteria for ranking.",
                            )}
                        >
                            Points
                        </th>
                        <th title="Win-Loss-Draw record">Record</th>
                        <th
                            title={title(
                                "Opponent Match Win Percentage: Average of your opponents' match win percentages.",
                                "Higher is better; this is the first tiebreaker.",
                            )}
                        >
                            OMW%
                        </th>
                        <th
                            title={title(
                                "Game Win Percentage: Your game win percentages.",
                                "Higher is better; this is the second tiebreaker.",
                            )}
                        >
                            GW%
                        </th>
                        <th
                            title={title(
                                "Opponent Game Win Percentage: Average of your opponents' game win percentages.",
                                "Higher is better; this is the third tiebreaker.",
                            )}
                        >
                            OGW%
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {standings?.map((standing) => (
                        <tr key={standing.player.id}>
                            <td>{standing.rank ?? NA}</td>
                            <td>
                                {standing.player.name}
                                <IconParticipationChange
                                    type={standing.participationChange}
                                />
                            </td>
                            <td>{standing.matchPoints}</td>
                            <td>
                                {formatRecord(
                                    standing.matchWins,
                                    standing.matchLosses,
                                    standing.matchDraws,
                                )}
                            </td>
                            <td>
                                {standing.opponentMatchWinPercentage === 0
                                    ? NA
                                    : format(
                                          standing.opponentMatchWinPercentage,
                                      )}
                            </td>
                            <td>{format(standing.gameWinPercentage)}</td>
                            <td>
                                {standing.opponentGameWinPercentage === 0
                                    ? NA
                                    : format(
                                          standing.opponentGameWinPercentage,
                                      )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

function format(value: number, decimals = 1): string {
    return (value * 100).toFixed(decimals);
}

function title(...lines: string[]) {
    return lines.join("\n");
}
