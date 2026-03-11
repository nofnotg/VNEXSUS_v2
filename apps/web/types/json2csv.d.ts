declare module "json2csv" {
  export class Parser<T = Record<string, unknown>> {
    constructor(options?: { fields?: string[] });
    parse(data: T[]): string;
  }

  export class Transform<T = Record<string, unknown>> extends NodeJS.ReadWriteStream {
    constructor(
      options?: { fields?: string[] },
      transformOptions?: { objectMode?: boolean },
      asyncOptions?: Record<string, unknown>
    );
  }
}
