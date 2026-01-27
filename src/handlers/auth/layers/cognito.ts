import {
  AdminInitiateAuthCommand,
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { Effect, Layer } from "effect";
import { AuthError } from "@handlers/auth/domain/errors.js";
import { CognitoIdentityProvider } from "@handlers/auth/domain/cognitoItentityProvider.js";
import type { AuthFlowType } from "@aws-sdk/client-cognito-identity-provider";

const CognitoIdentityProviderLive = Layer.effect(
  CognitoIdentityProvider,
  Effect.sync(() => {
    const cognitoClient = new CognitoIdentityProviderClient({});
    return {
      signUp: (params: {
        ClientId: string;
        Username: string;
        Password: string;
        UserAttributes?: { Name: string; Value: string }[];
      }) =>
        Effect.tryPromise({
          try: () => cognitoClient.send(new SignUpCommand(params)),
          catch: (cause) => new AuthError({ cause }),
        }),
      confirmSignUp: (params: { ClientId: string; Username: string; ConfirmationCode: string }) =>
        Effect.tryPromise({
          try: () => cognitoClient.send(new ConfirmSignUpCommand(params)),
          catch: (cause) => new AuthError({ cause }),
        }),
      adminInitiateAuth: (params: {
        AuthFlow: AuthFlowType;
        ClientId: string;
        UserPoolId: string;
        AuthParameters: {
          USERNAME: string;
        };
      }) =>
        Effect.tryPromise({
          try: () => cognitoClient.send(new AdminInitiateAuthCommand(params)),
          catch: (cause) => new AuthError({ cause }),
        }),
    };
  }),
);

export { CognitoIdentityProviderLive };
