import type {
  AdminInitiateAuthCommandOutput,
  ConfirmSignUpCommandOutput,
  SignUpCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
import { Context, Effect } from "effect";
import { AuthError } from "@handlers/auth/domain/errors.js";
import type { AuthFlowType } from "@aws-sdk/client-cognito-identity-provider";

class CognitoIdentityProvider extends Context.Tag("CognitoIdentityProvider")<
  CognitoIdentityProvider,
  {
    readonly signUp: (params: {
      ClientId: string;
      Username: string;
      Password: string;
      UserAttributes?: { Name: string; Value: string }[];
    }) => Effect.Effect<SignUpCommandOutput, AuthError>;
    readonly confirmSignUp: (params: {
      ClientId: string;
      Username: string;
      ConfirmationCode: string;
    }) => Effect.Effect<ConfirmSignUpCommandOutput, AuthError>;
    readonly adminInitiateAuth: (params: {
      AuthFlow: AuthFlowType;
      ClientId: string;
      UserPoolId: string;
      AuthParameters: {
        USERNAME: string;
      };
    }) => Effect.Effect<AdminInitiateAuthCommandOutput, AuthError>;
  }
>() {}

export { CognitoIdentityProvider };
