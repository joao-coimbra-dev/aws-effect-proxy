import { type APIGatewayProxyResultV2, LambdaHandler } from "@effect-aws/lambda";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { ConfigError, Effect, ParseResult } from "effect";
import { AuthError, ErrorTags } from "@handlers/auth/domain/errors.js";
import { CognitoIdentityProvider } from "@handlers/auth/domain/cognitoItentityProvider.js";
import { CognitoIdentityProviderLive } from "@handlers/auth/layers/cognito.js";
import { signup } from "@handlers/auth/services/signup.js";
import { confirm } from "@handlers/auth/services/confirm.js";
import { ParseBodyError } from "@domain/errors.js";

const authEffect: (
  event: APIGatewayProxyEventV2,
) => Effect.Effect<
  APIGatewayProxyResultV2,
  ConfigError.ConfigError | ParseBodyError | ParseResult.ParseError | AuthError,
  CognitoIdentityProvider
> = Effect.fn("authEffect")(function* (event: APIGatewayProxyEventV2) {
  const { routeKey } = event;

  switch (routeKey) {
    case "POST /signup": {
      return yield* signup(event.body);
    }
    case "POST /confirm": {
      return yield* confirm(event.body);
    }
    default:
      return yield* Effect.succeed({
        statusCode: 404,
        body: JSON.stringify({ message: "Not Found" }),
        headers: { "Content-Type": "application/json" },
      });
  }
});

const handler = LambdaHandler.make(
  (event: APIGatewayProxyEventV2): Effect.Effect<APIGatewayProxyResultV2> =>
    authEffect(event).pipe(
      Effect.provide(CognitoIdentityProviderLive),
      Effect.catchTags(ErrorTags),
    ),
);

export { handler };
