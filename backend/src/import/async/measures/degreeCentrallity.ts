import ImportAPISpecs from "api-specifications/import";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";

import { Readable } from "node:stream";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillConnection } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

/**
 * Updates the degree centrality for the given skills. The degree centrality is the number of edges connected to a skill.
 * @param {ISkillConnection[]} skills - The skills to update.
 * @returns {Promise<RowsProcessedStats>} - A Promise that resolves to the number of rows processed, the number of rows successfully updated and the number of rows that failed.
 */
export async function updateSkillDegreeCentrality(skills: ISkillConnection[]): Promise<RowsProcessedStats> {
  const response = await getRepositoryRegistry().skill.updateSkillDegreeCentrality(skills);

  return {
    rowsFailed: response.modifiedCount === skills.length ? 0 : skills.length - response.modifiedCount,
    rowsSuccess: response.modifiedCount,
    rowsProcessed: skills.length,
  };
}

/**
 * Calculates the degree centrality for the given modelId.
 * @param {ImportAPISpecs.Types.POST.Request.Payload} event - The event object containing details for the import process.
 */
async function calculateSkillDegreeCentrality(event: ImportAPISpecs.Types.POST.Request.Payload) {
  const BATCH_SIZE = 1000;

  // Get all skills Connections for the given modelId and group them by skillId to calculate the degree centrality.
  const groupBySkill: Readable = getRepositoryRegistry().occupationToSkillRelation.groupBySkillId(event.modelId);
  const batchProcessor = new BatchProcessor<ISkillConnection>(BATCH_SIZE, updateSkillDegreeCentrality);

  for await (const skill of groupBySkill) {
    await batchProcessor.add(skill);
  }

  await batchProcessor.flush();

  console.info(batchProcessor.getStats());
}

export { calculateSkillDegreeCentrality };
