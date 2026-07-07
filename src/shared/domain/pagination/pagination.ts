export type Meta = {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
};

export type Pagination<Item> = {
  items: Item[];
  meta: Meta;
};

export type PaginationInput = {
  page?: number | null;
  direction?: 'ASC' | 'DESC' | null;
  limit?: number | null;
};



