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
    readonly getUserById: (id: string) => Effect.Effect<User | null, UserRepositoryError>;
    readonly deleteUser: (id: string) => Effect.Effect<void, UserRepositoryError>;
    readonly updateUser: (user: User) => Effect.Effect<User, UserRepositoryError>;
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
      getUserById: (id: string) =>
        ddb
          .getItem({
            TableName: tableName,
            Key: { id: { S: id } },
          })
          .pipe(
            Effect.map((response) => {
              if (!response.Item) {
                return null;
              }
              return unmarshall(response.Item) as User;
            }),
            Effect.mapError((cause) => new UserRepositoryError({ cause })),
          ),
      deleteUser: (id: string) =>
        ddb
          .deleteItem({
            TableName: tableName,
            Key: { id: { S: id } },
          })
          .pipe(Effect.mapError((cause) => new UserRepositoryError({ cause }))),
      updateUser: (user: User) =>
        ddb
          .updateItem({
            TableName: tableName,
            Key: { id: { S: user.id } },
            UpdateExpression: "SET #name = :name, #email = :email",
            ExpressionAttributeNames: {
              "#name": "name",
              "#email": "email",
            },
            ExpressionAttributeValues: {
              ":name": { S: user.name },
              ":email": { S: user.email },
            },
            ConditionExpression: "attribute_exists(id)",
            ReturnValues: "ALL_NEW",
          })
          .pipe(
            Effect.map(
              (response) => ({ id: user.id, ...unmarshall(response.Attributes!) }) as User,
            ),
            Effect.mapError((cause) => new UserRepositoryError({ cause })),
          ),
    };
  }),
);
