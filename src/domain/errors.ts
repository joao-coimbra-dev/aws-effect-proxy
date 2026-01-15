import { Data } from "effect";

class ProxyFetchError extends Data.TaggedError("ProxyFetchError")<{
  readonly error: unknown;
}> {}

class ReadResponseBodyError extends Data.TaggedError("ReadResponseBodyError")<{
  readonly error: unknown;
}> {}

export { ProxyFetchError, ReadResponseBodyError };
