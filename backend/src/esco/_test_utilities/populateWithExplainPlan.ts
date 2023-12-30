import mongoose from "mongoose";

/**
 * This function sets up a spy on mongoose.Model.populate() that will call explain() on the query plan in addition to executing the query.
 * The query plan is stored in the explainedPlans array that is returned by this function.
 *
 * IMPORTANT: This function must be called before any calls to mongoose.Model.populate() are made.
 * This is usually done before calling the function that will populate a document, typically a find() or findById() call.
 *
 * IMPORTANT: Make sure that the original populate() and exec() functions are restored by adding an afterEach() function :
 * afterEach(() => {
 *    jest.spyOn(mongoose.Model, "populate").mockRestore();
 *    jest.spyOn(mongoose.Query.prototype, "exec").mockRestore();
 * });
 * @param model The model on of the document that will be populated, typically the model that is used in a find() or findById() call.
 * @returns {any[]} An array of query plans that were returned by the explain() call. Notice that multiple query plans for each path that is populated and also for each sub document.
 * For example, if the path "parent" is populated, then there will be two query plans, one for the parent path to populate the hierarchy model and to actually populate the parent reference.
 * For example, if the "child" path is also populated, then a query will be return for populating the hierarchy model, and an additional for one for each child to populate the child reference.
 * The array will contain the query plans that were returned by the explain() call once the the function that will populate a document has resolved
 *
 * Example:
 *
 *   const actualPlans = setUpPopulateWithExplain(repository.Model);
 *   await repository.findId(someId);
 *   expect(actualPlans.length).toBe(1);
 */
export function setUpPopulateWithExplain<T>(model: mongoose.Model<T>): ExplainedPlanPartial[] {
  const explainedPlans: ExplainedPlanPartial[] = [];
  // Make a copy of the original Query.exec() function
  // the code of the original Query.exec()  function is in node_modules/mongoose/lib/query.js
  const actualExec = mongoose.Query.prototype.exec;
  // Now define a function that will first make call explain() on a query and then execute the query to get the expected documents.
  // This is needed because if we call explain() on a query, then the query will not return any documents, instead it will return only the explanation.
  const overriddenExec = async function () {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _Query: mongoose.Query = this; // this refers to the query object

    // First execute a copy of the query with explain()
    // The exec function needs to be bound to the query object, as it expects the query data to be bound to "this".
    let exec = actualExec.bind(_Query.clone().explain("executionStats"));
    const explainedPlan = await exec();
    explainedPlans.push(explainedPlan);

    // Now execute the original query to get the expected documents.
    exec = actualExec.bind(_Query.clone());
    return exec();
  };

  // Make a copy of the original Model.populate() function and bind it to the model.
  // The code of the original Model.populate() function is in node_modules/mongoose/lib/model.js
  const actualPopulate = mongoose.Model.populate.bind(model);
  jest.spyOn(mongoose.Model, "populate").mockImplementationOnce((docs, paths) => {
    // Once the spy is called override the exec function of the query object with the overriddenExec function defined above.
    // We are interested in the Query.exec that mongoose.Model.populate() will call (not the query of the find or findById that we call in our code)
    // see function _execPopulateQuery() in node_modules/mongoose/lib/model.js
    jest.spyOn(mongoose.Query.prototype, "exec").mockImplementation(overriddenExec);
    // Now call the original populate() function with arguments that mongoose passes to it.
    return actualPopulate(docs, paths);
  });

  return explainedPlans;
}

/**
 * This type includes only the fields that are interesting from the query plan.
 */
export type ExplainedPlanPartial = {
  command: {
    find: string;
    filter: mongoose.FilterQuery<unknown>;
  };
  queryPlanner: {
    winningPlan: {
      stage: string;
      inputStage: {
        stage: string;
        keyPattern: mongoose.IndexDefinition;
      };
    };
  };
};

/**
 * This function returns an object that can be used in an expect() call to check that the query plan is as expected.
 * @param plan
 */
export function getExpectedPlan(plan: {
  collectionName: string;
  filter: mongoose.FilterQuery<unknown>;
  usedIndex: mongoose.IndexDefinition;
}) {
  return expect.objectContaining({
    command: expect.objectContaining({
      find: plan.collectionName,
      filter: plan.filter,
    }),
    queryPlanner: expect.objectContaining({
      winningPlan: {
        stage: "FETCH",
        inputStage: expect.objectContaining({
          stage: "IXSCAN",
          keyPattern: plan.usedIndex,
        }),
      },
    }),
  });
}
