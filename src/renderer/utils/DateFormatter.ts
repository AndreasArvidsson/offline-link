export class DateFormatter {
    public constructor(private readonly locale: string) {}

    public format(date: number): string {
        return new Date(date).toLocaleString(this.locale, {
            dateStyle: "medium",
            timeStyle: "short",
        });
    }
}
