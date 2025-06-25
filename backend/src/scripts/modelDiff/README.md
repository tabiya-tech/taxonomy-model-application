# Model Difference Analysis Tool

A CLI tool for comparing two Tabiya taxonomy models and generating detailed difference reports.

## Overview

This tool analyzes differences between two taxonomy models by comparing entities (Skills, Occupations, Skill Groups, Occupation Groups) and their associations (hierarchies, relationships). It generates a JSON report categorizing differences as items that exist only in one model or items that exist in both but with different properties.

## Prerequisites

Refer to the [backend's README](/backend/README.md#prerequisites) for system requirements and installation instructions.

## Usage

### CLI Interface

```bash
cd /path/to/tabiya/platform/backend/src/scripts/modelDiff

./cli.ts -l /path/to/left/model -r /path/to/right/model -o /path/to/output/folder
```

For all available options and detailed descriptions, run:

```bash
./cli.ts --help
```

### Programmatic Usage

```typescript
import { diff } from "./main";

const result = await diff({
  leftModelPath: "/path/to/left/model",
  rightModelPath: "/path/to/right/model",
  outputFolderPath: "/path/to/output/folder",
  outputFileName: "differences.json", // optional
  verbose: true, // optional
});
```

## Output

Generates a JSON file with differences categorized as:

- `left`: Items only in left model
- `right`: Items only in right model
- `common`: Items in both models with differences

## Model Requirements

Each model directory must contain `model_info.csv` and associated taxonomy CSV files.

## Troubleshooting

For permission issues, ensure the CLI script is executable:

```bash
chmod +x cli.ts
```

> Note: Use absolute paths
