import { ConfirmInput } from "@handlers/auth/domain/confirm.js";
import { confirm } from "@handlers/auth/services/confirm.js";
import { CognitoIdentityProvider } from "@handlers/auth/domain/cognitoItentityProvider.js";
import { Effect, Layer, ConfigProvider, Exit } from "effect";
import { describe, expect, it } from "@effect/vitest";
import { DeliveryMediumType } from "@aws-sdk/client-cognito-identity-provider";
import { ParseBodyError } from "@domain/errors.js";

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

describe("Confirm service", () => {
  it("should confirm a user and issue a JWT", async () => {
    const input: ConfirmInput = {
      email: "test@example.com",
      confirmationCode: "123456",
    };

    const program = confirm(JSON.stringify(input)).pipe(Effect.provide(TestLiveAuthService));

    const result = await Effect.runPromise(program);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toStrictEqual({
      message: "Email confirmed successfully and logged in.",
      AccessToken: "access-token",
      IdToken: "id-token",
      RefreshToken: "refresh-token",
      ExpiresIn: 3600,
      TokenType: "Bearer",
    });
  });

  it("should return an error if the event body is invalid JSON", async () => {
    const program = confirm("invalid json").pipe(Effect.provide(TestLiveAuthService));

    const result = await Effect.runPromiseExit(program);

    expect(result).toStrictEqual(Exit.fail(new ParseBodyError({ cause: "..." })));
  });

  it("should return an error if the event body is a JSON with invalid structure", async () => {
    const program = confirm('{ invalid: "property"}').pipe(Effect.provide(TestLiveAuthService));

    const result = await Effect.runPromiseExit(program);

    expect(result).toStrictEqual(Exit.fail(new ParseBodyError({ cause: "..." })));
  });
});
