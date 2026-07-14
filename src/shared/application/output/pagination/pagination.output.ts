export class MetaOutput {
  constructor(
    readonly totalItems: number,
    readonly itemCount: number,
    readonly itemsPerPage: number,
    readonly totalPages: number,
    readonly currentPage: number,
  ) {}
}

export class PaginationOutput<T> {
  readonly items: T[];
  readonly meta: MetaOutput;

  constructor(items: T[], meta: MetaOutput) {
    this.items = items;
    this.meta = meta;
  }
}

export type Pagination<T> = PaginationOutput<T>;
