import { Config, Effect, Schema } from "effect";
import { ParseBodyError } from "@domain/errors.js";
import { CognitoIdentityProvider } from "@handlers/auth/domain/cognitoItentityProvider.js";
import { ConfirmInput } from "@handlers/auth/domain/confirm.js";
import { AuthFlowType } from "@aws-sdk/client-cognito-identity-provider";

const parseAndDecodeConfirmBody = Effect.fn("parseAndDecodeConfirmBody")(function* (
  eventBody: string = "{}",
) {
  return yield* Schema.decodeUnknown(Schema.parseJson(ConfirmInput))(eventBody).pipe(
    Effect.mapError((e) => new ParseBodyError({ cause: e })),
  );
});

const cognitoConfirm = Effect.fn("cognitoConfirm")(function* ({
  email,
  confirmationCode,
}: ConfirmInput) {
  const cognito = yield* CognitoIdentityProvider;
  const clientId = yield* Config.string("COGNITO_CLIENT_ID");

  yield* cognito.confirmSignUp({
    ClientId: clientId,
    Username: email,
    ConfirmationCode: confirmationCode,
  });
});

const cognitoIssueJWT = Effect.fn("cognitoIssueJWT")(function* (email: string) {
  const cognito = yield* CognitoIdentityProvider;
  const clientId = yield* Config.string("COGNITO_CLIENT_ID");
  const userPoolId = yield* Config.string("COGNITO_USER_POOL_ID");

  return yield* cognito.adminInitiateAuth({
    AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
    ClientId: clientId,
    UserPoolId: userPoolId,
    AuthParameters: {
      USERNAME: email,
    },
  });
});

const confirm = Effect.fn("confirm")(function* (eventBody?: string) {
  const decodedBody = yield* parseAndDecodeConfirmBody(eventBody);

  yield* cognitoConfirm(decodedBody);

  const output = yield* cognitoIssueJWT(decodedBody.email);

  yield* Effect.logInfo(output);

  return yield* Effect.succeed({
    statusCode: 200,
    body: JSON.stringify({
      message: "Email confirmed successfully and logged in.",
      ...output.AuthenticationResult,
    }),
    headers: { "Content-Type": "application/json" },
  });
});

export { confirm };
