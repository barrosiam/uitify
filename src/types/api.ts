export type SortOrder = "asc" | "desc";

export type ListResult<T> = {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
};

export type ListParamsBase<E extends object> = {
  q?: string;
  _page?: number;
  _limit?: number;
  _sort?: keyof E;
  _order?: SortOrder;
};
