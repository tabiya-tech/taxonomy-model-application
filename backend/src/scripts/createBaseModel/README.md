# Create Base Model Script

This script is an internal tool to convert a standard model into a new **_base model_**. It generates unique UUIDs and adds them on top of uuid history for the following CSV files:

- model_info.csv
- occupation_groups.csv
- occupations.csv
- skill_groups.csv
- skills.csv

The script takes a source folder with existing CSV files, adds a unique UUID to each entry, and outputs the updated files to a target folder.

If the target folder does not exist, the script will create it.

### Example Usage

The following example reads from a specified source directory (`/path/to/source/folder`) and outputs the updated files to the destination folder (`/path/to/destination/folder`).

```javascript
createBaseModel({
  source: "/path/to/source/folder",
  destination: "/path/to/destination/folder/",
});
```
