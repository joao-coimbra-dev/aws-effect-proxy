import { randomUUID } from "crypto";
import { Context, Layer, Effect } from "effect";
import { User, UserInput } from "@domain/user.js";
import { UserRepository, UserRepositoryError } from "@repositories/user.js";

export class UserService extends Context.Tag("UserService")<
  UserService,
  {
    readonly createUser: (userInput: UserInput) => Effect.Effect<User, UserRepositoryError>;
    readonly getUsers: () => Effect.Effect<User[], UserRepositoryError>;
  }
>() {}

export const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const userRepository = yield* UserRepository;

    return {
      createUser: Effect.fn("UserService.createUser")(function* (userInput: UserInput) {
        const newUser = new User({
          id: randomUUID(),
          ...userInput,
        });
        return yield* userRepository.createUser(newUser);
      }),
      getUsers: Effect.fn("UserService.getUsers")(function* () {
        return yield* userRepository.getUsers();
      }),
    };
  }),
);
