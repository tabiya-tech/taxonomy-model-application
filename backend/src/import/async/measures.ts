import ImportAPISpecs from "api-specifications/import";
import errorLogger from "common/errorLogger/errorLogger";
import { DegreeCentralityService } from "esco/interestingMeasures/DegreeCentralityService";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";

/**
 * Calculates interesting measures for the given modelId.
 *  For now, we are calculating the interesting measures for skills.
 *  1. Degree Centrality
 *
 * @param {ImportAPISpecs.Types.POST.Request.Payload} event - The event object containing details for the import process.
 * @throws Errors from this function are expected to be caught in the calling async import handler.
 * @returns {Promise<void>}
 */
export async function processMeasures(event: ImportAPISpecs.Types.POST.Request.Payload): Promise<void> {
  console.info("Calculating interesting measures for modelId: ", event.modelId);

  const degreeCentralityService = new DegreeCentralityService(
    getRepositoryRegistry().skill.Model,
    getRepositoryRegistry().occupationToSkillRelation.relationModel
  );

  try {
    await Promise.all([degreeCentralityService.calculateDegreeCentrality(event.modelId)]);
  } catch (e) {
    console.error(e);
    const err = new Error(`Error in calculating interesting measures for modelId: ${event.modelId}`, { cause: e });
    errorLogger.logError(err);
    throw err;
  }
}
