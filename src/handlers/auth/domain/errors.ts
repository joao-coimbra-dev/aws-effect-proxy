import {
  CodeMismatchException,
  ExpiredCodeException,
  UserNotFoundException,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider";
import { ConfigError, Data, Effect, ParseResult } from "effect";
import { ParseBodyError } from "@domain/errors.js";
import type { APIGatewayProxyResultV2 } from "@effect-aws/lambda";

class AuthError extends Data.TaggedError("AuthError")<{
  readonly cause: unknown;
}> {}

const ErrorTags = {
  ConfigError: (error: ConfigError.ConfigError): Effect.Effect<APIGatewayProxyResultV2> =>
    Effect.succeed({
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error - Configuration Error", error }),
      headers: { "Content-Type": "application/json" },
    }),
  ParseBodyError: (error: ParseBodyError): Effect.Effect<APIGatewayProxyResultV2> =>
    Effect.succeed({
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid request body", error: String(error.cause) }),
      headers: { "Content-Type": "application/json" },
    }),
  ParseError: (error: ParseResult.ParseError): Effect.Effect<APIGatewayProxyResultV2> =>
    Effect.succeed({
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid input data", errors: error.message }),
      headers: { "Content-Type": "application/json" },
    }),
  AuthError: (error: AuthError): Effect.Effect<APIGatewayProxyResultV2> => {
    if (error.cause instanceof UsernameExistsException) {
      return Effect.succeed({
        statusCode: 409,
        body: JSON.stringify({ message: error.cause.message }),
        headers: { "Content-Type": "application/json" },
      });
    }
    if (error.cause instanceof CodeMismatchException) {
      return Effect.succeed({
        statusCode: 400,
        body: JSON.stringify({ message: error.cause.message }),
        headers: { "Content-Type": "application/json" },
      });
    }
    if (error.cause instanceof ExpiredCodeException) {
      return Effect.succeed({
        statusCode: 400,
        body: JSON.stringify({ message: error.cause.message }),
        headers: { "Content-Type": "application/json" },
      });
    }
    if (error.cause instanceof UserNotFoundException) {
      return Effect.succeed({
        statusCode: 404,
        body: JSON.stringify({ message: error.cause.message }),
        headers: { "Content-Type": "application/json" },
      });
    }
    return Effect.succeed({
      statusCode: 500,
      body: JSON.stringify({
        message: "Authentication operation failed",
        error: String(error.cause),
      }),
      headers: { "Content-Type": "application/json" },
    });
  },
};

export { AuthError, ErrorTags };
