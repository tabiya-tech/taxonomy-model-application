import "_test_utilities/consoleMock";

import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Transactional, TxContext } from "./transactional";

interface ICounterDoc {
  name: string;
  value: number;
}

let replSet: MongoMemoryReplSet;
let connection: mongoose.Connection;
let Counter: mongoose.Model<ICounterDoc>;
let service: CounterService;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  connection = await mongoose.createConnection(replSet.getUri(), { dbName: "transactional_test" }).asPromise();
  Counter = connection.model<ICounterDoc>("Counter", new mongoose.Schema({ name: String, value: Number }));
  service = new CounterService();
}, 30_000);

afterAll(async () => {
  await connection.close();
  await replSet.stop();
});

beforeEach(async () => {
  await Counter.deleteMany({});
});

class CounterService {
  get Model() {
    return Counter;
  }

  @Transactional()
  async writeThreeInTransaction(names: [string, string, string], ctx: TxContext = {}): Promise<void> {
    const { session } = ctx;
    await Counter.create([{ name: names[0], value: 1 }], { session });
    await Counter.create([{ name: names[1], value: 2 }], { session });
    await Counter.create([{ name: names[2], value: 3 }], { session });
  }

  @Transactional()
  async writeThree(names: [string, string, string], ctx: TxContext = {}): Promise<void> {
    const { session } = ctx;
    await Counter.create([{ name: names[0], value: 1 }], { session });
    await Counter.create([{ name: names[1], value: 2 }], { session });
    await Counter.create([{ name: names[2], value: 3 }], { session });
  }

  @Transactional()
  async writeTwoThenFail(names: [string, string], ctx: TxContext = {}): Promise<void> {
    const { session } = ctx;
    await Counter.create([{ name: names[0], value: 1 }], { session });
    await Counter.create([{ name: names[1], value: 2 }], { session });
    throw new Error("forced failure");
  }
}

describe("Test @Transactional decorator", () => {
  describe("rollback and commit", () => {
    test("should commit all writes when the method succeeds", async () => {
      // GIVEN three document names
      const givenNames: [string, string, string] = ["counter_1", "counter_2", "counter_3"];

      // WHEN the transactional method completes without error
      await service.writeThree(givenNames);

      // THEN all documents from the given names should be persisted
      const actualDocs = await Counter.find({}).lean();
      expect(actualDocs).toHaveLength(givenNames.length);
      expect(actualDocs.map((d) => d.name).sort()).toEqual([...givenNames].sort());
    });

    test("should roll back all writes when the method throws", async () => {
      // GIVEN two document names and a method that fails after writing them
      const givenNames: [string, string] = ["counter_1", "counter_2"];

      // WHEN the transactional method throws after two successful writes
      await expect(service.writeTwoThenFail(givenNames)).rejects.toThrow("forced failure");

      // THEN no documents should be persisted (all writes rolled back)
      const actualDocs = await Counter.find({}).lean();
      expect(actualDocs).toHaveLength(0);
    });

    test("should work with multiple concurrent transactions", async () => {
      // GIVEN two sets of document names
      const givenNamesSet1: [string, string, string] = ["counter_set1_1", "counter_set1_2", "counter_set1_3"];
      const givenNamesSet2: [string, string, string] = ["counter_set2_1", "counter_set2_2", "counter_set2_3"];

      // WHEN two transactional methods are called concurrently
      await Promise.all([service.writeThree(givenNamesSet1), service.writeThree(givenNamesSet2)]);

      // THEN all documents from both sets should be persisted
      const expectedNames = [...givenNamesSet1, ...givenNamesSet2].sort();
      const actualDocs = await Counter.find({}).lean();
      expect(actualDocs).toHaveLength(expectedNames.length);
      expect(actualDocs.map((d) => d.name).sort()).toEqual(expectedNames);
    });

    test("should roll back only the failed transaction when concurrent transactions run", async () => {
      // GIVEN two sets of document names, one of which will fail
      const givenFailingNames: [string, string] = ["counter_fail_1", "counter_fail_2"];
      const givenSucceedingNames: [string, string, string] = ["counter_ok_1", "counter_ok_2", "counter_ok_3"];

      // WHEN one transactional method throws while the other succeeds
      await Promise.allSettled([service.writeTwoThenFail(givenFailingNames), service.writeThree(givenSucceedingNames)]);

      // THEN only the successful transaction's documents should be persisted
      const actualDocs = await Counter.find({}).lean();
      expect(actualDocs).toHaveLength(givenSucceedingNames.length);
      expect(actualDocs.map((d) => d.name).sort()).toEqual([...givenSucceedingNames].sort());
    });
  });

  describe("session lifecycle", () => {
    test("should run the method inside withTransaction and end the session", async () => {
      // GIVEN a session with a spied withTransaction
      const givenNames: [string, string, string] = ["counter_1", "counter_2", "counter_3"];
      const givenSession = await connection.startSession();
      jest.spyOn(givenSession, "withTransaction");
      jest.spyOn(givenSession, "endSession");
      const startSessionSpy = jest.spyOn(connection, "startSession").mockResolvedValueOnce(givenSession);

      // WHEN the transactional method completes without error
      await service.writeThree(givenNames);

      // THEN withTransaction and endSession should have been called
      expect(givenSession.withTransaction).toHaveBeenCalled();
      expect(givenSession.endSession).toHaveBeenCalled();

      startSessionSpy.mockRestore();
    });

    test("should end the session even when the method throws", async () => {
      // GIVEN a session with a spied endSession
      const givenNames: [string, string] = ["counter_1", "counter_2"];
      const givenSession = await connection.startSession();
      jest.spyOn(givenSession, "endSession");
      const startSessionSpy = jest.spyOn(connection, "startSession").mockResolvedValueOnce(givenSession);

      // WHEN the transactional method throws
      await expect(service.writeTwoThenFail(givenNames)).rejects.toThrow("forced failure");

      // THEN the session should still have been ended
      expect(givenSession.endSession).toHaveBeenCalled();

      startSessionSpy.mockRestore();
    });
  });

  describe("error propagation", () => {
    const givenNamesForError: [string, string, string] = ["counter_1", "counter_2", "counter_3"];

    test("should propagate the error untouched and end the session when the transaction fails", async () => {
      // GIVEN a session whose withTransaction rejects (the driver has already retried
      // whatever was retryable before surfacing an error to us)
      const givenError = new Error("occupation has children");
      const givenSession = {
        withTransaction: jest.fn().mockRejectedValue(givenError),
        endSession: jest.fn().mockResolvedValue(undefined),
      } as unknown as mongoose.ClientSession;
      const startSessionSpy = jest.spyOn(connection, "startSession").mockResolvedValue(givenSession);

      // WHEN the transactional method is called
      // THEN the original error should surface unwrapped
      await expect(service.writeThreeInTransaction(givenNamesForError)).rejects.toThrow(givenError);

      // AND the transaction should have been attempted exactly once
      expect(givenSession.withTransaction).toHaveBeenCalledTimes(1);
      expect(startSessionSpy).toHaveBeenCalledTimes(1);
      // AND the session should still have been ended
      expect(givenSession.endSession).toHaveBeenCalled();

      startSessionSpy.mockRestore();
    });
  });
});
