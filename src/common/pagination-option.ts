export class PaginationOption {
  offset: number;
  limit: number;

  static readonly DEFAULT_LIMIT = 15;
  static readonly DEFAULT_OFFSET = 0;

  static readonly DEFAULT: PaginationOption = {
    offset: PaginationOption.DEFAULT_OFFSET,
    limit: PaginationOption.DEFAULT_LIMIT,
  };
}
