import type { ParticipationType, Round } from "../../common/models";

export function getPlayerParticipations(
    rounds: Round[],
): Map<number, ParticipationType> {
    const participation = new Map<number, ParticipationType>();

    for (const round of rounds) {
        for (const change of round.participationChanges) {
            // Disqualification takes effect immediately and overrides any drop.
            // Ordinary drops take effect for standings once the round completes.
            if (
                change.type === "DISQUALIFIED" ||
                (round.status === "COMPLETED" &&
                    participation.get(change.playerId) !== "DISQUALIFIED")
            ) {
                participation.set(change.playerId, change.type);
            }
        }
    }

    return participation;
}
