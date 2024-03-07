
# Tabiya CSV Documentation

The tabiya CSV format is used to import and export data from the Tabiya Open Taxonomy platform. 

There are 9 CSV files in the format. Each file contains a different type of data. The files are:
- [Model Info](#model-info)
- [Skill Groups](#skill-groups)
- [Skills](#skills)
- [Skill Hierarchy](#skill-hierarchy)
- [Skill to Skill Relations](#skill-to-skill-relations)
- [ISCO Groups](#isco-groups)
- [Occupations](#occupations)
- [Occupation Hierarchy](#occupation-hierarchy) 
- [Occupation to Skill Relations](#occupation-to-skill-relations)

## General notes on the fields of the CSV files

### UUID History

A `UUIDHISTORY` field is a [list](#lists) of all the UUIDs that have been assigned to an entity during its lifecycle, e.g. when the entity is created, imported, exported or copied into our platform.

It is an identifier that can be used for tracking objects not only across their lifecycle, but also across systems. 

The UUID history is ordered from newest to oldest UUID. 

The first entry in the list is the current UUID of the object.
The last entry in the list is the very first (_initial_) UUID of the object.

The entities in this dataset have been assigned an initial UUID. When an entity is imported into our platform, a new UUID will be issued and added at the top of UUID history.   

The UUID used by the platform are based on the [Universally Unique Identifier v4](https://datatracker.ietf.org/doc/html/rfc4122) standard.

> The maximum number of UUIDs in the history for an object is constrained to `10000`.

### Origin Uri

The `ORIGINURI` field is a [URI](https://datatracker.ietf.org/doc/html/rfc3986) that points to the location where an entity was originally defined.

> The maximum length for the Origin Uri is `4096` characters.

### ID

The `ID` field is a unique identifier for each entity in the CSV dataset. It is used for referencing within the CSV dataset, for example, in the relations between entities.

This field is not meant to be used as an identifier outside the scope of the CSV files, for that purpose you should use the first entry in the [UUID History](#uuid-history).

### Object Types

The object types are used to differentiate between different types of entities in the dataset. 

For example in relations between entities, the object types are used to specify the type of the parent and child objects and determine in which file these objects can  be located.

The object types in the CSV files are:
- `skill`: Represents a [skill](#skills).
- `skillgroup`: Represents a [skill group](#skill-groups).
- `escooccupation`: Represents an [occupation](#occupations) that originates from the ESCO framework.
- `localoccupation`: Represents an [occupation](#occupations) that not originate from the ESCO framework and is defined only this taxonomy.
- `iscogroup`: Represents an [ISCO group](#isco-groups).

### Lists

List properties are stored in the CSV files as strings separated by a `\n` character. Currently, we do not support values that contain a new line.

### Dates

The dates in the CSV files are stored in the [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format.

## File descriptions

### Model Info
Contains information about the model. The export filename is `model_info.csv`
#### Columns
- [`UUIDHISTORY`](#uuid-history): A list of [UUIDs](#uuid-history).
- `NAME`: The name of the model. 
- `LOCALE`: The short code of the model's locale.
- `DESCRIPTION`: The description of the model.
- `VERSION`: The version of the model.
- `RELEASED`: A boolean value that indicates whether the model is released or not.
- `RELEASENOTES`: The release notes of the model.
- `CREATEDAT`: The [date](#dates) the model was created.
- `UPDATEDAT`: The [date](#dates) the model was last updated.

### Skills
Contains the skills of the taxonomy. The export filename is `skills.csv`
#### Columns
- [`ORIGINURI`](#origin-uri): A [URI](#origin-uri) that points to the location where the skill was originally defined.
- [`ID`](#id): A [unique identifier](#id), used for referencing the skill within the CSV dataset.
- [`UUIDHISTORY`](#uuid-history): A list of [UUIDs](#uuid-history).
- `SKILLTYPE`: The skill type. 
  - Possible values: `skill/competence`,`knowledge`,`language`,`attitude` or empty (` `).
- `REUSELEVEL`:  The skill reuse level. 
  - Possible values: `sector-specific`,`occupation-specific`,`cross-sector`,`transversal` or empty (` `).
- `PREFERREDLABEL`: The preferred label of the skill.
- `ALTLABELS`: A [list](#lists) of alternative labels for the skill.
  - Maximum length per label: `256` characters.
  - Maximum number of labels: `100`.
- `DESCRIPTION`: The skill description. 
  -  Maximum length:`4000` characters.
- `DEFINITION`: The skill definition. 
  -  Maximum length:`4000` characters.
- `SCOPENOTE`: The skill scope note. 
  -  Maximum length:`4000` characters.
- `CREATEDAT`: The [date](#dates) the skill was created.
- `UPDATEDAT`: The [date](#dates) the skill was last updated.

### Skill Groups
Contains the skill groups of the taxonomy. The export filename is `skill_groups.csv`

#### Columns
- [`ORIGINURI`](#origin-uri): A [URI](#origin-uri) that points to the location where the skill group was originally defined.
- [`ID`](#id): A [unique identifier](#id), used for referencing the skill group within the CSV dataset.
- [`UUIDHISTORY`](#uuid-history): A list of [UUIDs](#uuid-history).
- `CODE`: SkillGroup code as defined in ESCO. It has the general format `SX.X.X`, where `X` is a number.
- `PREFERREDLABEL`: The preferred label of the skill group.
- `ALTLABELS`: A [list](#lists) of alternative labels for the skill group.
  - Maximum length per label: `256` characters.
  - Maximum number of labels: `100`.
- `DESCRIPTION`: The skill group description. 
  -  Maximum length:`4000` characters.
- `SCOPENOTE`: The skill group scope note. 
  -  Maximum length:`4000` characters.
- `CREATEDAT`: The [date](#dates) the skill group was created.
- `UPDATEDAT`: The [date](#dates) the skill group was last updated.

### Occupations
Contains the occupations of the taxonomy. The export filename is `occupations.csv`

#### Columns
- [`ORIGINURI`](#origin-uri): A [URI](#origin-uri) that points to the location where the occupation was originally defined.
- [`ID`](#id): A [unique identifier](#id), used for referencing the occupation within the CSV dataset.
- [`UUIDHISTORY`](#uuid-history): A list of [UUIDs](#uuid-history).
- `ISCOGROUPCODE`: A four digit identification code of the ISCO group that the occupation belongs to.
- `CODE`: An occupation code assigned to the occupation. 
- `PREFERREDLABEL`: The preferred label of the occupation.
- `ALTLABELS`: A [list](#lists) of alternative labels for the occupation.
  - Maximum length per label: `256` characters.
  - Maximum number of labels: `100`.
- `DESCRIPTION`: The occupation description.
  -  Maximum length:`4000` characters.
- `DEFINITION`: The occupation definition.
  -  Maximum length:`4000` characters.
- `SCOPENOTE`: The occupation scope note.
  -  Maximum length:`4000` characters.
- `REGULATEDPROFESSIONNOTE`: The regulated profession note.
  -  Maximum length:`4000` characters.
- `OCCUPATIONTYPE`: The type of the occupation. 
  - Possible values: `escooccupation` or `localoccupation`.
- `ISLOCALIZED`: A boolean value that indicates whether the occupation is localized or not. Only ocuppations of the type `escooccupation` can be localized.
  - Possible values: `true` or `false`.
- `CREATEDAT`: The [date](#dates) the occupation was created.
- `UPDATEDAT`: The [date](#dates) the occupation was last updated.

### ISCO Groups
Contains the ISCO groups of the taxonomy. The export filename is `isco_groups.csv`

### Columns
- [`ORIGINURI`](#origin-uri): A [URI](#origin-uri) that points to the location where the ISCO group was originally defined.
- [`ID`](#id): A [unique identifier](#id), used for referencing the ISCO group within the CSV dataset.
- [`UUIDHISTORY`](#uuid-history): A list of [UUIDs](#uuid-history).
- `CODE`: A four digit identification code of the ISCO group.
- `PREFERREDLABEL`: The preferred label of the ISCO group.
- `ALTLABELS`: A [list](#lists) of alternative labels for the ISCO group.
  - Maximum length per label: `256` characters.
  - Maximum number of labels: `100`.
- `DESCRIPTION`: The ISCO group description.
  -  Maximum length:`4000` characters.
- `CREATEDAT`: The [date](#dates) the ISCO group was created.
- `UPDATEDAT`: The [date](#dates) the ISCO group was last updated.

### Skill-to-Skill Relations
Contains the relations between skills. The export filename is `skill_to_skill_relations.csv`

#### Columns
- `REQUIRINGID`: The [`ID`](#id) of the skill that requires another skill.
- `RELATIONTYPE`: The type of the relation. 
  - Possible values: `essential` or `optional`.
- `REQUIREDID`: The  [`ID`](#id) of the skill that is required by another skill.
- `CREATEDAT`: The [date](#dates) the relation was created.
- `UPDATEDAT`: The [date](#dates) the relation was last updated.

### Occupation-to-Skill Relations
Contains the relations between occupations and skills. The export filename is `occupation_to_skill_relations.csv`

#### Columns
- `OCCUPATIONTYPE`: The type of the occupation. 
  - Possible values: `escooccupation` or `localoccupation`.
- `OCCUPATIONID`: The  [`ID`](#id) of the occupation.
- `RELATIONTYPE`: The type of the relation. 
  - Possible values: `essential` or `optional`. 
- `SKILLID`: The  [`ID`](#id) of the skill.
- `CREATEDAT`: The [date](#dates) the relation was created.
- `UPDATEDAT`: The [date](#dates) the relation was last updated.

### Skill Hierarchy
Contains the hierarchical structure of various skills. The export filename is `skill_hierarchy.csv`

#### Columns
- `PARENTOBJECTTYPE`: The type of the parent object. 
  - Possible values: `skill` or `skillgroup`.
- `PARENTID`: The  [`ID`](#id) of the parent object.
- `CHILDID`: The  [`ID`](#id) of the child object.
- `CHILDOBJECTTYPE`: The type of the child object.
  - Possible values: `skill` or `skillgroup`.
- `CREATEDAT`: The [date](#dates) the relation was created.
- `UPDATEDAT`: The [date](#dates) the relation was last updated.

> Caveat: A skill cannot be the parent of a skill group.

### Occupation Hierarchy
Contains the hierarchical structure of various occupations. The export filename is `occupation_hierarchy.csv`

#### Columns
- `PARENTOBJECTTYPE`: The type of the parent object. 
  - Possible values: `iscogroup`, `escooccupation`, `localoccupation`.
- `PARENTID`: The  [`ID`](#id) of the parent object.
- `CHILDID`: The  [`ID`](#id) of the child object.
- `CHILDOBJECTTYPE`: The type of the child object.
  - Possible values: `iscogroup`, `escooccupation`, `localoccupation`.
- `CREATEDAT`: The [date](#dates) the relation was created.
- `UPDATEDAT`: The [date](#dates) the relation was last updated.

> Caveat: An `escooccupation` cannot be the parent of an 'iscogroup'.
> Caveat: An `localoccupation` can be a child of an `escooccupation` or another `localoccupation`.