import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { PlayerStanding, Tournament } from "../../common/models";
import { IconDropped } from "./components/IconDropped";
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
            <strong>Standings</strong> - After round{" "}
            {lastCompletedRound ?? "N/A"}
            <table className="table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th title="Match Points">Points</th>
                        <th title="Win-Loss-Draw Record">Record</th>
                        <th title="Opponent Match Win Percentage: How well your opponents performed in their matches, averaged once per match you played against them. Each opponent's percentage is their match points divided by the maximum possible points, including their byes, with a minimum of 33%. Your own byes add no opponent. Higher is better; this is the first tiebreaker after match points.">
                            OMW%
                        </th>
                        <th title="Game Win Percentage: The share of possible game points you earned across individual games. A game win earns 3 points, a draw earns 1, and a loss earns 0. Divide your game points by 3 times the number of games played, with a minimum of 33%. A bye counts as two game wins. Higher is better; this is the second tiebreaker.">
                            GW%
                        </th>
                        <th title="Opponent Game Win Percentage: How well your opponents performed in their individual games, averaged once per match you played against them. Each opponent's game win percentage includes their byes and has a minimum of 33% for this calculation. Your own byes add no opponent. Higher is better; this is the third tiebreaker.">
                            OGW%
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {standings?.map((standing, index) => (
                        <tr key={standing.player.id}>
                            <td>{index + 1}</td>
                            <td>
                                {standing.player.name}
                                {standing.dropped && <IconDropped />}
                            </td>
                            <td>{standing.matchPoints}</td>
                            <td>
                                {formatRecord(
                                    standing.wins,
                                    standing.losses,
                                    standing.draws,
                                )}
                            </td>
                            <td>
                                {format(standing.opponentMatchWinPercentage)}
                            </td>
                            <td>{format(standing.gameWinPercentage)}</td>
                            <td>
                                {format(standing.opponentGameWinPercentage)}
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
