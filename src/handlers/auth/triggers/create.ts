import type { CreateAuthChallengeTriggerHandler } from "aws-lambda";

export const handler: CreateAuthChallengeTriggerHandler = async (event) => {
  // This is a dummy trigger.
  // In a real-world scenario, you might send a code here.
  // For our auto-login flow, we don't need to do anything.
  return event;
};
