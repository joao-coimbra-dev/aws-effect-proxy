import { randomBytes } from "node:crypto";
import { Config, Effect, Schema } from "effect";
import { ParseBodyError } from "@domain/errors.js";
import { CognitoIdentityProvider } from "@handlers/auth/domain/cognitoItentityProvider.js";
import { SignUpInput } from "@handlers/auth/domain/signup.js";

const parseAndDecodeSignupBody = Effect.fn("parseSignupBody")(function* (eventBody: string = "{}") {
  return yield* Schema.decodeUnknown(Schema.parseJson(SignUpInput))(eventBody).pipe(
    Effect.mapError((e) => new ParseBodyError({ cause: e })),
  );
});

const cognitoSignup = Effect.fn("cognitoSignup")(function* (email: string) {
  const cognito = yield* CognitoIdentityProvider;
  const clientId = yield* Config.string("COGNITO_CLIENT_ID");

  yield* cognito.signUp({
    ClientId: clientId,
    Username: email,
    // This is simply a throwaway password
    Password: randomBytes(32).toString("base64"),
    UserAttributes: [{ Name: "email", Value: email }],
  });
});

const signup = Effect.fn("signup")(function* (eventBody?: string) {
  const { email } = yield* parseAndDecodeSignupBody(eventBody);

  yield* cognitoSignup(email);

  return yield* Effect.succeed({
    statusCode: 201,
    body: JSON.stringify({
      message: "User registered successfully, an OTP has been sent to your email for confirmation.",
    }),
    headers: { "Content-Type": "application/json" },
  });
});

export { signup };
