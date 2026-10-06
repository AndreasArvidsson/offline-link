import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import type { RecentTournament } from "../../api.ts";
import { APP_NAME } from "../../common/constants.ts";
import type { DateFormatter } from "./DateFormatter.ts";
import { GoBackButton } from "./GoBackButton.tsx";
import { handleError } from "./handleError.ts";
import { Loading } from "./Loading.tsx";
import { TournamentList } from "./TournamentList.tsx";
import type { View } from "./types.ts";

interface Props {
    dateFormatter: DateFormatter;
    navigate: (view: View) => void;
}

export function TournamentsView({
    dateFormatter,
    navigate,
}: Props): JSX.Element {
    const [tournaments, setTournaments] = useState<RecentTournament[]>();

    useEffect(() => {
        window.api
            .getRecentTournaments()
            .then(setTournaments)
            .catch(handleError);
    }, []);

    if (tournaments == null) {
        return <Loading />;
    }

    return (
        <>
            <h1>Tournaments</h1>

            <GoBackButton navigate={navigate} />

            <p>All tournaments saved in Documents/{APP_NAME}.</p>

            <TournamentList
                tournaments={tournaments}
                dateFormatter={dateFormatter}
                navigate={navigate}
            />
        </>
    );
}
