import { Context, Layer, Effect, Config, Data } from "effect";
import { DynamoDB } from "@effect-aws/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { User } from "@domain/user.js";

export class UserRepositoryError extends Data.TaggedError("UserRepositoryError")<{
  readonly cause: unknown;
}> {}

export class UserRepository extends Context.Tag("UserRepository")<
  UserRepository,
  {
    readonly createUser: (user: User) => Effect.Effect<User, UserRepositoryError>;
    readonly getUsers: () => Effect.Effect<User[], UserRepositoryError>;
  }
>() {}

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const ddb = yield* DynamoDB;
    const tableName = yield* Config.string("USERS_TABLE_NAME");

    return {
      createUser: (user: User) =>
        ddb
          .putItem({
            TableName: tableName,
            Item: {
              id: { S: user.id },
              name: { S: user.name },
              email: { S: user.email },
            },
          })
          .pipe(
            Effect.map(() => user),
            Effect.mapError((cause) => new UserRepositoryError({ cause })),
          ),
      getUsers: () =>
        ddb
          .scan({
            TableName: tableName,
          })
          .pipe(
            Effect.map((response) => {
              if (!response.Items) {
                return [];
              }
              return response.Items.map((item) => unmarshall(item) as User);
            }),
            Effect.mapError((cause) => new UserRepositoryError({ cause })),
          ),
    };
  }),
);
