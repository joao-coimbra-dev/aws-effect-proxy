import { type APIGatewayProxyResultV2, LambdaHandler } from "@effect-aws/lambda";
import { Config, Effect, ConfigError } from "effect";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

const usersCrudEffect: (
  event: APIGatewayProxyEventV2,
) => Effect.Effect<APIGatewayProxyResultV2, ConfigError.ConfigError, never> = Effect.fn(
  "usersCrudEffect",
)(function* (event: APIGatewayProxyEventV2) {
  const tableName = yield* Config.string("USERS_TABLE_NAME");

  const { routeKey } = event;

  switch (routeKey) {
    case "POST /users":
      return yield* Effect.succeed({
        statusCode: 201,
        body: JSON.stringify({
          message: "User created (implement me)",
          tableName,
          receivedBody: event.body,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

    case "GET /users":
      return yield* Effect.succeed({
        statusCode: 200,
        body: JSON.stringify({ message: "List all users (implement me)", tableName }),
        headers: {
          "Content-Type": "application/json",
        },
      });

    case "GET /users/{id}":
      return yield* Effect.succeed({
        statusCode: 200,
        body: JSON.stringify({
          message: `Get user ${event.pathParameters?.id} (implement me)`,
          tableName,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

    case "PUT /users/{id}":
      return yield* Effect.succeed({
        statusCode: 200,
        body: JSON.stringify({
          message: `Update user ${event.pathParameters?.id} (implement me)`,
          tableName,
          receivedBody: event.body,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

    case "DELETE /users/{id}":
      return yield* Effect.succeed({
        statusCode: 200,
        body: JSON.stringify({
          message: `Delete user ${event.pathParameters?.id} (implement me)`,
          tableName,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

    default:
      return yield* Effect.succeed({
        statusCode: 404,
        body: JSON.stringify({ message: "Not Found" }),
        headers: {
          "Content-Type": "application/json",
        },
      });
  }
});

const handler = LambdaHandler.make((event: APIGatewayProxyEventV2) =>
  usersCrudEffect(event).pipe(
    Effect.catchTags({
      ConfigError: (error: ConfigError.ConfigError) =>
        Effect.succeed({
          statusCode: 500,
          body: JSON.stringify({ message: "Internal Server Error - Configuration Error", error }),
        }),
    }),
  ),
);

export { handler };
