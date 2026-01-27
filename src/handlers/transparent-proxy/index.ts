import { type APIGatewayProxyResultV2, LambdaHandler } from "@effect-aws/lambda";
import { Config, Effect, ConfigError } from "effect";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { ProxyFetchError, ReadResponseBodyError } from "@domain/errors.js";
import { filterResponseHeaders } from "@utils/filterResponseHeaders.js";

const httpProxyEffect: (
  event: APIGatewayProxyEventV2,
) => Effect.Effect<
  APIGatewayProxyResultV2,
  ProxyFetchError | ReadResponseBodyError | ConfigError.ConfigError,
  never
> = Effect.fn("httpProxyEffect")(function* (event: APIGatewayProxyEventV2) {
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

  const multiValueHeaders = yield* filterResponseHeaders(response.headers);

  return {
    statusCode: response.status,
    body,
    multiValueHeaders,
  };
});

const index = LambdaHandler.make((event: APIGatewayProxyEventV2) =>
  httpProxyEffect(event).pipe(
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
      ConfigError: (error: ConfigError.ConfigError) =>
        Effect.succeed({
          statusCode: 500,
          body: JSON.stringify({ message: "Internal Server Error - Configuration Error", error }),
        }),
    }),
  ),
);

export { index };
