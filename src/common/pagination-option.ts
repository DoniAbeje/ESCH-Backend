export class PaginationOption {
  offset: number;
  limit: number;

  static getDefault(): PaginationOption {
    return { offset: 0, limit: 15 };
  }
}
