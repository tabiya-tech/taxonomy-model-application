import mongoose from "mongoose";

/**
 * The transaction context a @Transactional() method receives.
 * Pass it to every DB call in the method body so those operations
 * join the transaction.
 */
export type TxContext = { session?: mongoose.ClientSession };

/**
 * Runs the wrapped method inside a MongoDB transaction via session.withTransaction()
 *
 * CONTRACT — a decorated method must:
 *  - be declared on a class exposing a mongoose `Model` (the connection comes from it);
 *  - accept a `TxContext` as its LAST declared parameter, defaulted to `{}`
 *
 * Requires a replica set (or mongos); a standalone mongod cannot start transactions.
 */
export function Transactional() {
  return function (_target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    const withContext = (args: unknown[], session: mongoose.ClientSession): unknown[] => {
      const nextArgs = [...args];
      const last = nextArgs[nextArgs.length - 1];
      const isContext =
        typeof last === "object" && last !== null && !Array.isArray(last) && !(last instanceof mongoose.Types.ObjectId);
      if (isContext) {
        nextArgs[nextArgs.length - 1] = { ...(last as TxContext), session };
      } else {
        nextArgs.push({ session });
      }
      return nextArgs;
    };

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const model = (this as { Model?: mongoose.Model<unknown> }).Model;
      if (!model?.db) {
        throw new Error(
          `@Transactional() on "${propertyKey}": the host class must expose a mongoose Model to derive the connection from.`
        );
      }
      const db: mongoose.Connection = model.db;

      const session = await db.startSession();
      try {
        let returnValue: unknown;
        await session.withTransaction(async () => {
          returnValue = await original.apply(this, withContext(args, session));
        });
        return returnValue;
      } finally {
        await session.endSession().catch(() => undefined);
      }
    };

    return descriptor;
  };
}
