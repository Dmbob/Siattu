interface Service<T> {
    get(id: string): Promise<T | null>
    upsert(obj: T): Promise<T>
    delete(id: string): Promise<T>
    list(offset: number, pageSize: number): Promise<T[]>
}