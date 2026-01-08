export default interface IRepo
    <
        TRow,
        TInsert,
        TUpdate,
        TKey = string
    > {
    getById(id: TKey | undefined): Promise<TRow | null>;
    list(parentId?: string): Promise<TRow[]>;
    insert(payload: TInsert): Promise<TRow | null>;
    update(patch: Partial<TUpdate>): Promise<TRow | null>;
    upsert(payload: TInsert): Promise<TRow | null>;
    delete(id: TKey): Promise<void>;
}