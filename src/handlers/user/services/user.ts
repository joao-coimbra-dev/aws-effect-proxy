import { randomUUID } from "crypto";
import { Context, Layer, Effect } from "effect";
import { User, UserInput } from "@handlers/user/domain/user.js";
import { UserRepository, UserRepositoryError } from "@handlers/user/repositories/user.js";

export class UserService extends Context.Tag("UserService")<
  UserService,
  {
    readonly createUser: (userInput: UserInput) => Effect.Effect<User, UserRepositoryError>;
    readonly getUsers: () => Effect.Effect<User[], UserRepositoryError>;
    readonly getUserById: (id: string) => Effect.Effect<User | null, UserRepositoryError>;
    readonly deleteUser: (id: string) => Effect.Effect<void, UserRepositoryError>;
    readonly updateUser: (user: User) => Effect.Effect<void, UserRepositoryError>;
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
      getUserById: Effect.fn("UserService.getUserById")(function* (id: string) {
        return yield* userRepository.getUserById(id);
      }),
      deleteUser: Effect.fn("UserService.deleteUser")(function* (id: string) {
        yield* userRepository.deleteUser(id);
      }),
      updateUser: Effect.fn("UserService.updateUser")(function* (user: User) {
        return yield* userRepository.updateUser(user);
      }),
    };
  }),
);
