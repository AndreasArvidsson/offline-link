import type { PlayerStanding, Tournament } from "../../common/models";
import { comparePercentages } from "./comparePercentages";
import { getPlayerParticipations } from "./getPlayerParticipations";
import { getPlayersByeCount } from "./getPlayersByeCount";
import { getRecords } from "./getRecords";

// Magic Tournament Rules, section 3.1 and Appendix C:
// https://media.wizards.com/ContentResources/WPN/MTG_MTR_2026_Feb27_EN.pdf

export function calculateStandings(tournament: Tournament): PlayerStanding[] {
    const participation = getPlayerParticipations(tournament.rounds);
    const byeCount = getPlayersByeCount(tournament.rounds);
    const records = getRecords(tournament);

    return tournament.players
        .map((player): PlayerStanding => {
            const record = records.get(player.id);
            let opponentMatchWinSum = 0;
            let opponentGameWinSum = 0;

            for (const opponentId of record.opponentIds) {
                const opponent = records.get(opponentId);

                opponentMatchWinSum += opponent.matchWinPercentage;
                opponentGameWinSum += opponent.gameWinPercentage;
            }

            const opponentMatchWinPercentage =
                record.opponentIds.length > 0
                    ? opponentMatchWinSum / record.opponentIds.length
                    : 0;
            const opponentGameWinPercentage =
                record.opponentIds.length > 0
                    ? opponentGameWinSum / record.opponentIds.length
                    : 0;

            return {
                rank: null,
                player,
                participationChange: participation.get(player.id),
                byeCount: byeCount.get(player.id) ?? 0,
                matchPoints: record.matchPoints,
                matchWins: record.matchWins,
                matchLosses: record.matchLosses,
                matchDraws: record.matchDraws,
                gameWinPercentage: record.gameWinPercentage,
                opponentMatchWinPercentage,
                opponentGameWinPercentage,
            };
        })
        .toSorted(
            (a, b) =>
                // Disqualified players are ranked lower than all others
                Number(a.participationChange === "DISQUALIFIED") -
                    Number(b.participationChange === "DISQUALIFIED") ||
                // Higher match points are ranked higher
                b.matchPoints - a.matchPoints ||
                // Higher opponent match win percentage is ranked higher
                comparePercentages(
                    b.opponentMatchWinPercentage,
                    a.opponentMatchWinPercentage,
                ) ||
                // Higher game win percentage is ranked higher
                comparePercentages(b.gameWinPercentage, a.gameWinPercentage) ||
                // Higher opponent game win percentage is ranked higher
                comparePercentages(
                    b.opponentGameWinPercentage,
                    a.opponentGameWinPercentage,
                ),
        )
        .map((standing, index) => ({
            ...standing,
            rank:
                standing.participationChange === "DISQUALIFIED"
                    ? null
                    : index + 1,
        }));
}
