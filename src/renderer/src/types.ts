interface SimpleView {
    type: "home" | "tournaments" | "tournamentNew";
}

interface TournamentView {
    type: "tournament";
    id: string;
}

export type View = SimpleView | TournamentView;
