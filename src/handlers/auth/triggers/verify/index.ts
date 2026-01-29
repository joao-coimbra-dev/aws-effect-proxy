import type { VerifyAuthChallengeResponseTriggerHandler } from "aws-lambda";

export const handler: VerifyAuthChallengeResponseTriggerHandler = async (event) => {
  // This is the crucial part of the "auto-approve" flow.
  // We are considering the challenge as "answered" correctly
  // without any user input.
  event.response.answerCorrect = true;
  return event;
};
