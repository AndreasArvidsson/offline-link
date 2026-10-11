import type { JSX } from "preact";
import { NA } from "../../common/constants";
import "./MatchScoreBoxes.css";

interface Props {
    player1Wins: number | undefined;
    player2Wins: number | undefined;
}

export function MatchScoreBoxes({
    player1Wins,
    player2Wins,
}: Props): JSX.Element {
    return (
        <span className="match-score-boxes">
            <span title="Player 1 game wins">{player1Wins ?? NA}</span>
            <span className="ms-2" title="Player 2 game wins">
                {player2Wins ?? NA}
            </span>
        </span>
    );
}
