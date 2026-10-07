import { useEffect, useState } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import type { Parameters } from "../../api.ts";
import { Loading } from "./components/Loading.tsx";
import { HomeView } from "./HomeView.tsx";
import { initializeKeyListener } from "./keyListener.ts";
import { TournamentsView } from "./TournamentsView.tsx";
import { TournamentView } from "./TournamentView.tsx";
import type { View } from "./types.ts";
import { DateFormatter } from "./utils/DateFormatter.ts";
import { handleError } from "./utils/handleError.ts";

export function App(): JSX.Element {
    const [view, setView] = useState<View>({ type: "home" });
    const [parameters, setParameters] = useState<Parameters>();

    useEffect(() => {
        window.api.getParameters().then(setParameters).catch(handleError);
        const disposable = initializeKeyListener();
        return () => {
            disposable.dispose();
        };
    }, []);

    if (parameters == null) {
        return <Loading />;
    }

    const dateFormatter = new DateFormatter(parameters.locale);

    const renderView = () => {
        const { type } = view;
        switch (type) {
            case "home":
                return (
                    <HomeView
                        navigate={setView}
                        dateFormatter={dateFormatter}
                    />
                );
            case "tournaments":
                return (
                    <TournamentsView
                        navigate={setView}
                        dateFormatter={dateFormatter}
                    />
                );
            case "tournament":
                return (
                    <TournamentView
                        navigate={setView}
                        id={view.id}
                        dateFormatter={dateFormatter}
                    />
                );
            case "tournamentNew":
                return (
                    <TournamentView
                        navigate={setView}
                        id={null}
                        dateFormatter={dateFormatter}
                    />
                );
            default: {
                const _exhaustiveCheck: never = type;
                throw new Error("Unhandled view type");
            }
        }
    };

    return <div className="container pt-3">{renderView()}</div>;
}
