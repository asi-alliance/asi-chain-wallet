export default class ItemManager<T> {
    protected readonly items: Map<string, T>;
    constructor(items?: Map<string, T>);
    add(id: string, item: T): void;
    addMany(entries: Iterable<[string, T]>): void;
    remove(id: string): T;
    get(id: string): T | null;
    removeByFilter(filter: (item: T) => boolean): T[];
    getByFilter(filter: (item: T) => boolean): T[];
    hasByFilter(filter: (item: T) => boolean): boolean;
    has(id: string): boolean;
    getAll(): T[];
    getMap(): Map<string, T>;
    clear(): void;
}
