## Retain Keys Script.

### How it works.

This script is used to retain IDs in a specific model so that it can be commited. The IDs it retains are of format `key_{{ key id }}` eg: `key_1`.

Most of the time this script will be used if we want to commit a downloaded Model. After downloading the model exported keys are of format `ObjectId` and we can't commit the ObjectIds.

So to retain the original keys we run this script.

It takes, the following parameters:

1. `exportedModelPath`: The Downloaded/Exported Model path to be retained. It is the one containing the keys to replace.

2. `referenceModalPath`: The Model path to be used as a reference. It is the one containing the keys to replace with.

3. `destinationPath`: The destination path where the retained model will be saved. It is the one containing the keys to replace with.

Usage:

```typescript
retainKeys({
  exportedModelPath: "/path/to/exported/model",

  referenceModalPath: "/path/to/source/model",
  destinationPath: "/path/to/destination/model",
}).catch((err) => {
  console.error("Error:", err);
});
```

### With these changes the script asserts the following

- The length of the records in all the files are the same.

Manually you can use the function named `removeRecentUUIDs.ts` and use your own tool to compare the files.

Usage:

```typescript
removeRecentUUIDsFromModel({
  source: "/path/to/source/model",
  destination: "/path/to/destination/model",
}).catch(console.error);

```
