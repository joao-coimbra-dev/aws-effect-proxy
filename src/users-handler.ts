import { type APIGatewayProxyResultV2, LambdaHandler } from "@effect-aws/lambda";
import { Effect, Layer, Schema, Config, ConfigError, ParseResult } from "effect";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { UserService, UserServiceLive } from "@services/user.js";
import { UserRepositoryError, UserRepositoryLive } from "@repositories/user.js";
import { ParseBodyError } from "@domain/errors.js";
import { UserInput } from "@domain/user.js";
import { DynamoDB } from "@effect-aws/client-dynamodb";

const usersCrudEffect = Effect.fn("usersCrudEffect")(function* (event: APIGatewayProxyEventV2) {
  const userService = yield* UserService;
  const { routeKey } = event;

  yield* Effect.logInfo(routeKey);

  switch (routeKey) {
    case "POST /users": {
      const postEffect = Effect.gen(function* () {
        const parseBody = Effect.try({
          try: () => JSON.parse(event.body ?? "{}"),
          catch: (cause) => new ParseBodyError({ cause }),
        });

        const body = yield* parseBody;
        const userInput = yield* Schema.decode(UserInput)(body);
        const newUser = yield* userService.createUser(userInput);

        return {
          statusCode: 201,
          body: JSON.stringify(newUser),
          headers: { "Content-Type": "application/json" },
        };
      });

      return yield* postEffect;
    }
    case "GET /users": {
      const getEffect = Effect.gen(function* () {
        const users = yield* userService.getUsers();

        return {
          statusCode: 200,
          body: JSON.stringify(users),
          headers: { "Content-Type": "application/json" },
        };
      });

      return yield* getEffect;
    }
    case "GET /users/{id}": {
      const getByIdEffect = Effect.gen(function* () {
        const id = event.pathParameters?.id;

        if (!id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "User ID is missing from path parameters" }),
            headers: { "Content-Type": "application/json" },
          };
        }

        const user = yield* userService.getUserById(id);

        if (!user) {
          return {
            statusCode: 404,
            body: JSON.stringify({ message: `User with id ${id} not found` }),
            headers: { "Content-Type": "application/json" },
          };
        }

        return {
          statusCode: 200,
          body: JSON.stringify(user),
          headers: { "Content-Type": "application/json" },
        };
      });

      return yield* getByIdEffect;
    }
    case "PUT /users/{id}": {
      const putEffect = Effect.gen(function* () {
        const id = event.pathParameters?.id;

        if (!id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "User ID is missing from path parameters" }),
            headers: { "Content-Type": "application/json" },
          };
        }

        const parseBody = Effect.try({
          try: () => JSON.parse(event.body ?? "{}"),
          catch: (cause) => new ParseBodyError({ cause }),
        });

        const body = yield* parseBody;
        const userInput = yield* Schema.decode(UserInput)(body);

        const updatedUser = yield* userService.updateUser({ id, ...userInput });

        return {
          statusCode: 200,
          body: JSON.stringify(updatedUser),
          headers: { "Content-Type": "application/json" },
        };
      });

      return yield* putEffect;
    }
    case "DELETE /users/{id}": {
      const deleteEffect = Effect.gen(function* () {
        const id = event.pathParameters?.id;

        if (!id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ message: "User ID is missing from path parameters" }),
            headers: { "Content-Type": "application/json" },
          };
        }

        yield* userService.deleteUser(id);

        return {
          statusCode: 200,
        };
      });

      return yield* deleteEffect;
    }

    default:
      return yield* Effect.succeed({
        statusCode: 404,
        body: JSON.stringify({ message: "Not Found" }),
        headers: { "Content-Type": "application/json" },
      });
  }
}) as (
  event: APIGatewayProxyEventV2,
) => Effect.Effect<
  APIGatewayProxyResultV2,
  ConfigError.ConfigError | ParseBodyError | ParseResult.ParseError | UserRepositoryError,
  UserService
>;

const AppLayer = Config.string("AWS_REGION").pipe(
  Effect.map((awsRegion) =>
    UserServiceLive.pipe(
      Layer.provide(UserRepositoryLive),
      Layer.provide(DynamoDB.layer({ region: awsRegion })),
    ),
  ),
  Layer.unwrapEffect,
);

const handler = LambdaHandler.make(
  (event: APIGatewayProxyEventV2) =>
    usersCrudEffect(event).pipe(
      Effect.provide(AppLayer),
      Effect.catchTags({
        // Explicitly type each error to satisfy the compiler
        ConfigError: (error: ConfigError.ConfigError) =>
          Effect.succeed({
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error - Configuration Error", error }),
            headers: { "Content-Type": "application/json" },
          }),
        ParseBodyError: (error: ParseBodyError) =>
          Effect.succeed({
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid request body", error: String(error.cause) }),
            headers: { "Content-Type": "application/json" },
          }),
        ParseError: (error: ParseResult.ParseError) =>
          Effect.succeed({
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid user data", errors: error.message }), // Changed error.errors to error.message
            headers: { "Content-Type": "application/json" },
          }),
        UserRepositoryError: (error: UserRepositoryError) =>
          Effect.succeed({
            statusCode: 500,
            body: JSON.stringify({
              message: "Database operation failed",
              error: JSON.stringify(error.cause),
            }),
            headers: { "Content-Type": "application/json" },
          }),
      }),
    ) as Effect.Effect<APIGatewayProxyResultV2, never, never>,
);

export { handler, AppLayer, usersCrudEffect };
