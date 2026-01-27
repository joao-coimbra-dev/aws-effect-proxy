import type { DefineAuthChallengeTriggerHandler } from "aws-lambda";

export const handler: DefineAuthChallengeTriggerHandler = async (event) => {
  event.response.failAuthentication = false;
  event.response.issueTokens = true;

  return event;
};
