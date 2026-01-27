import { CognitoIdentityProvider } from "@handlers/auth/domain/cognitoItentityProvider.js";
import { Effect, Layer, ConfigProvider, Exit } from "effect";
import { describe, expect, it } from "@effect/vitest";
import { DeliveryMediumType } from "@aws-sdk/client-cognito-identity-provider";
import { ParseBodyError } from "@domain/errors.js";
import type { SignUpInput } from "@handlers/auth/domain/signup.js";
import { signup } from "@handlers/auth/services/signup.js";

const configProviderMock = ConfigProvider.fromMap(
  new Map([
    ["COGNITO_CLIENT_ID", "test-client-id"],
    ["COGNITO_USER_POOL_ID", "test-user-pool-id"],
  ]),
);

const CognitoMock = Layer.succeed(
  CognitoIdentityProvider,
  CognitoIdentityProvider.of({
    confirmSignUp: () => Effect.succeed({ $metadata: {} }),
    signUp: () =>
      Effect.succeed({
        $metadata: {},
        UserConfirmed: true,
        UserSub: "test-sub",
        CodeDeliveryDetails: {
          DeliveryMedium: DeliveryMediumType.EMAIL,
          Destination: "test@example.com",
        },
      }),
    adminInitiateAuth: () =>
      Effect.succeed({
        $metadata: {},
        AuthenticationResult: {
          AccessToken: "access-token",
          IdToken: "id-token",
          RefreshToken: "refresh-token",
          ExpiresIn: 3600,
          TokenType: "Bearer",
        },
      }),
  }),
);

const TestLiveAuthService = Layer.merge(CognitoMock, Layer.setConfigProvider(configProviderMock));

describe("Signup service", () => {
  it("should sign up a user", async () => {
    const input: SignUpInput = {
      email: "test@example.com",
    };

    const program = signup(JSON.stringify(input)).pipe(Effect.provide(TestLiveAuthService));

    const result = await Effect.runPromise(program);

    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body)).toStrictEqual({
      message: "User registered successfully, an OTP has been sent to your email for confirmation.",
    });
  });

  it("should return an error if the event body is invalid JSON", async () => {
    const program = signup("invalid json").pipe(Effect.provide(TestLiveAuthService));

    const result = await Effect.runPromiseExit(program);

    expect(result).toStrictEqual(Exit.fail(new ParseBodyError({ cause: "..." })));
  });

  it("should return an error if the event body is a JSON with invalid structure", async () => {
    const program = signup('{ invalid: "property"}').pipe(Effect.provide(TestLiveAuthService));

    const result = await Effect.runPromiseExit(program);

    expect(result).toStrictEqual(Exit.fail(new ParseBodyError({ cause: "..." })));
  });
});
