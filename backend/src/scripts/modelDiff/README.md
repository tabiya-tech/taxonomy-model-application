## Difference between two models

### How it works.

Calculates the difference between two models.

Inputs:-

1. `minuendModelPath`: The model path to be subtracted from.
2. `subtrahendModelPath`: The model path to be subtracted.

Usage:

```typescript
retainKeys({
  minuendModelPath: "/path/to/exported/model",
  subtrahendModelPath: "/path/to/source/model",
}).catch((err) => {
  console.error("Error:", err);
});
```
