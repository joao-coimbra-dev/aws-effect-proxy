import { Schema } from "effect";

class UserInput extends Schema.Class<UserInput>("UserInput")({
  name: Schema.NonEmptyString,
  email: Schema.NonEmptyString.pipe(Schema.pattern(/.+@.+/)),
}) {}

class User extends Schema.Class<User>("User")({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
}) {}

export { UserInput, User };
