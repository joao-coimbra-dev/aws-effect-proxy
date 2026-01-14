import { LambdaHandler } from "@effect-aws/lambda";
import { Chunk, Config, Data, Effect } from "effect";
import * as ReadonlyArray from "effect/Array";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

class ProxyFetchError extends Data.TaggedError("ProxyFetchError")<{
  error: unknown;
}> {}

class ReadResponseBodyError extends Data.TaggedError("ReadResponseBodyError")<{
  error: unknown;
}> {}

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
const filterResponseHeadersEffect = (headers: Headers) =>
  Effect.succeed(headers).pipe(
    Effect.map(ReadonlyArray.fromIterable),
    Effect.map(
      ReadonlyArray.reduce(
        {} as { [key: string]: string[] },
        (acc: { [key: string]: string[] }, [key, value]: [string, string]) => {
          if (!ExcludedHeaders.includes(key.toLowerCase())) {
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(value);
          }

          return acc;
        },
      ),
    ),
  );

const handler = LambdaHandler.make((event: APIGatewayProxyEventV2) =>
  Effect.gen(function* () {
    const targetUrl = yield* Config.string("TARGET_URL");

    const queryString = event.rawQueryString ? `?${event.rawQueryString}` : "";
    const fullTargetUrl = `${targetUrl}${event.rawPath}${queryString}`;

    const headers = { ...event.headers };
    delete headers["Host"];
    delete headers["X-Forwarded-For"];

    const { method } = event.requestContext.http;

    const fetchOptions: RequestInit = {
      method,
      headers: headers as HeadersInit,
    };

    if (method !== "GET" && method !== "HEAD") {
      fetchOptions.body = event.body ?? null;
    }

    const response = yield* Effect.tryPromise({
      try: () => fetch(fullTargetUrl, fetchOptions),
      catch: (error) => new ProxyFetchError({ error }),
    });

    const body = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: (error) => new ReadResponseBodyError({ error }),
    });

    const multiValueHeaders = yield* filterResponseHeadersEffect(response.headers);

    return {
      statusCode: response.status,
      body,
      multiValueHeaders,
    };
  }).pipe(
    Effect.catchTags({
      ProxyFetchError: (error: ProxyFetchError) =>
        Effect.succeed({
          statusCode: 502,
          body: JSON.stringify({ message: "Bad Gateway", error }),
        }),
      ReadResponseBodyError: (error: ReadResponseBodyError) =>
        Effect.succeed({
          statusCode: 502,
          body: JSON.stringify({ message: "Bad Gateway", error }),
        }),
    }),
    Effect.catchAll((error) =>
      Effect.succeed({
        statusCode: 500,
        body: JSON.stringify({ message: "Internal Server Error", error }),
      }),
    ),
  ),
);

export { handler };
