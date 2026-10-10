export class Lookup<K extends string | number, V> {
    private readonly map: Map<K, V>;

    public constructor(
        private readonly name: string,
        entries: [K, V][],
    ) {
        this.map = new Map(entries);
    }

    public get(key: K): V {
        const value = this.map.get(key);

        if (value == null) {
            throw new Error(`Key "${key}" not found in lookup "${this.name}"`);
        }

        return value;
    }
}
