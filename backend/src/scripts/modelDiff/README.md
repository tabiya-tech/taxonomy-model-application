# Model Difference Analysis Tool

A comprehensive tool for comparing two Tabiya taxonomy models and generating detailed difference reports.

## Overview

This tool analyzes differences between two taxonomy models by comparing:

- **Entities**: Skills, Occupations, Skill Groups, and Occupation Groups
- **Associations**: Relationships between entities (hierarchies, skill-to-skill relations, occupation-to-skill relations)

The tool generates a detailed JSON report categorizing differences as:

- Items that exist only in the left model
- Items that exist only in the right model
- Items that exist in both models but have different properties

## Usage

### Basic Usage

```typescript
import { diff } from "./main";

const result = await diff({
  leftModelPath: "/path/to/left/model",
  rightModelPath: "/path/to/right/model",
  outputFolderPath: "/path/to/output/folder",
});

console.log(`Results saved to: ${result.outputPath}`);
```

### Advanced Usage with Options

```typescript
import { diff } from "./main";

const result = await diff({
  leftModelPath: "/path/to/left/model",
  rightModelPath: "/path/to/right/model",
  outputFolderPath: "/path/to/output/folder",
  outputFileName: "custom_differences.json",
  verbose: true, // Enable detailed logging
});

// Access summary statistics
console.log("Differences Summary:");
console.log(`- Entities only in left: ${result.summary.leftOnlyEntities}`);
console.log(`- Entities only in right: ${result.summary.rightOnlyEntities}`);
console.log(`- Common entities with diffs: ${result.summary.commonEntitiesWithDiffs}`);

// Access performance metrics
console.log("Performance:");
console.log(`- Total time: ${result.performance.totalTime}ms`);
console.log(`- Loading time: ${result.performance.loadTime}ms`);
```

## Parameters

### Required Parameters

- **`leftModelPath`** (string): Absolute path to the left model directory containing CSV files
- **`rightModelPath`** (string): Absolute path to the right model directory containing CSV files
- **`outputFolderPath`** (string): Absolute path to the output directory where results will be saved

### Optional Parameters

- **`outputFileName`** (string): Custom filename for the output file (defaults to 'differences.json')
- **`verbose`** (boolean): Enable detailed logging during the process (defaults to false)

## Output Format

The tool generates a JSON file with the following structure:

```json lines
{
  "models": {
    "left": "Model Name v1.0.0",
    "right": "Model Name v2.0.0"
  },
  "left": {
    "entities": [...], // Items only in left model.
    "associations": [...]
  },
  "right": {
    "entities": [...], // Items only in right model.
    "associations": [...]
  },
  "common": {
    "entities": [...], // Items in both with differences
    "associations": [...]
  }
}
```

## Return Value

The `diff` function returns a `DiffResult` object containing:

```typescript
interface DiffResult {
  outputPath: string; // Path to generated file
  summary: {
    leftOnlyEntities: number;
    rightOnlyEntities: number;
    commonEntitiesWithDiffs: number;
    leftOnlyAssociations: number;
    rightOnlyAssociations: number;
    commonAssociationsWithDiffs: number;
  };
  performance: {
    loadTime: number; // Model loading time (ms)
    diffTime: number; // Comparison time (ms)
    writeTime: number; // File writing time (ms)
    totalTime: number; // Total execution time (ms)
  };
}
```
