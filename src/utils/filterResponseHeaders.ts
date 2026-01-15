import { Chunk, Effect } from "effect";
import * as ReadonlyArray from "effect/Array";
import { pipe } from "effect/Function";

const ExcludedHeaders: ReadonlyArray<string> = Chunk.toReadonlyArray(
  Chunk.make(
    "transfer-encoding",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "upgrade",
  ),
);

// Filter out hop-by-hop headers and correctly handle multi-value headers
// TODO This currently is lower casing the headers keys, the implementation should be refactored to avoid it
const filterResponseHeaders = (
  headers: Headers,
): Effect.Effect<{
  [key: string]: string[];
}> =>
  Effect.sync(() =>
    pipe(
      headers,
      ReadonlyArray.fromIterable,
      ReadonlyArray.reduce(
        {} as { [key: string]: string[] },
        (acc: { [key: string]: string[] }, [key, value]: [string, string]) => {
          if (!ExcludedHeaders.includes(key)) {
            if (!acc[key]) {
              acc[key] = [];
            }
            // The Headers iterator provides multiple entries for `set-cookie`.
            // Other multi-value headers are combined into a single comma-separated string.
            if (key === "set-cookie") {
              acc[key].push(value);
            } else {
              acc[key].push(...value.split(",").map((s) => s.trim()));
            }
          }
          return acc;
        },
      ),
    ),
  );

export { filterResponseHeaders };
