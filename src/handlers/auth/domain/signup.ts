import { Schema } from "effect";

class SignUpInput extends Schema.Class<SignUpInput>("SignUpInput")({
  email: Schema.NonEmptyString,
}) {}

export { SignUpInput };
