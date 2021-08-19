import { ParseArrayOptions, ParseArrayPipe, Query } from '@nestjs/common';
export function QueryArray(
  name: string,
  options: ParseArrayOptions = { items: String, optional: true },
) {
  return Query(name, new ParseArrayPipe(options));
}
