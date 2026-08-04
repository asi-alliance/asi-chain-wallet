import { Order, Pagination } from "@services/GraphqlParser/queryOptions";
export type TCollectionComparator<TItem> = (firstItem: TItem, secondItem: TItem) => number;
export default class CollectionQueryService {
    static sortByComparator<TItem>(items: TItem[], comparator: TCollectionComparator<TItem>): TItem[];
    static sortByDate<TItem>(items: TItem[], getDate: (item: TItem) => Date, order?: Order): TItem[];
    static mergeSorted<TItem>(primary: TItem[], secondary: TItem[], comparator: TCollectionComparator<TItem>): TItem[];
    static slice<TItem>(items: TItem[], pagination?: Pagination): TItem[];
}
