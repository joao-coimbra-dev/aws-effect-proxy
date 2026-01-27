import { Schema } from "effect";

class ConfirmInput extends Schema.Class<ConfirmInput>("ConfirmInput")({
  email: Schema.NonEmptyString,
  confirmationCode: Schema.NonEmptyString,
}) {}

export { ConfirmInput };
