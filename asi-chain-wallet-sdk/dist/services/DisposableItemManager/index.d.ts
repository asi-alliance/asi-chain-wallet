import ItemManager from "@services/ItemManager";
export interface IDisposable {
    dispose(): void;
}
export default class DisposableItemManager<T extends IDisposable> extends ItemManager<T> {
    add(id: string, item: T): void;
    remove(id: string): T;
    clear(): void;
}
