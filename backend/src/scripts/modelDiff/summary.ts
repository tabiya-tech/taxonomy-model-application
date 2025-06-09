import { Change } from "./esco/types";

function deIndent(text: string) {
  const lines = text.split('\n');
  const indent = lines.filter(line => line.trim()).reduce((min, line) => {
    const match = RegExp(/^(\s*)/).exec(line);
    const spaces = match ? match[1].length : 0;
    return Math.min(min, spaces);
  }, Infinity);
  return lines.map(line => line.slice(indent)).join('\n');
}

export function getDifferencesSummary(differences: Change[]) {
  const totalDifferences = differences.length;
  let summary = "";

  summary += deIndent(`
    # Model Differences Summary
    
    Total Differences: ${totalDifferences}
    
    # Differences Breakdown
    
    `);


  summary += deIndent(`  
    | # | Model ID | Model Name | Entity type | Entity ID | Entity Label | Change type | Changed Field |
    |---|---|---|---|---|---|---|---|
  `);

  let i = 1;
  for (const change of differences) {

    summary += `|${i}|${change.modelId}|${change.modelName}| ${change.entityType}| ${change.entity} | ${change.entityLabel} | ${change.type}|${change.label}|\n`;
    i++;
  }

  summary = summary.trim();
  return summary.trim();
}
