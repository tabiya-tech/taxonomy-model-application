
# Tabiya CSV Documentation

The tabiya CSV format is used to import and export data from the Tabiya Open Taxonomy platform. 

There are 9 CSV files in the format. Each file contains a different type of data. The files are:
- [Model Info](#model-info)
- [Skill Groups](#skill-groups)
- [Skills](#skills)
- [Skill Hierarchy](#skill-hierarchy)
- [Skill to Skill Relations](#skill-to-skill-relations)
- [Occupation Groups](#occupation-groups)
- [Occupations](#occupations)
- [Occupation Hierarchy](#occupation-hierarchy) 
- [Occupation to Skill Relations](#occupation-to-skill-relations)
- [LICENSE](#LICENSE)

## General notes on the fields of the CSV files

### Languages

The platform supports multiple translation languages. Each language is identified by a short code (e.g. `en`, `fr`), and has a corresponding uppercase CSV column suffix (e.g. `EN`, `FR`). The registry of supported languages is compiled into the platform and is not configurable at runtime. The currently supported languages are:

| Language   | Short code | CSV suffix |
|------------|------------|------------|
| English    | `en`       | `EN`       |
| French     | `fr`       | `FR`       |
| Spanish    | `es`       | `ES`       |
| Portuguese | `pt`       | `PT`       |
| Amharic    | `am`       | `AM`       |

#### Translatable fields and language-suffixed columns

Fields whose content can be translated (`PREFERREDLABEL`, `ALTLABELS`, `DESCRIPTION`, `DEFINITION`, `SCOPENOTE`, and `REGULATEDPROFESSIONNOTE` where applicable) carry one CSV column per language in the export format. The column name is the field name followed by `_` and the language's CSV suffix, for example `PREFERREDLABEL_EN`, `PREFERREDLABEL_FR`, `DESCRIPTION_EN`.

The set of language columns present in a file exactly matches the languages listed in the model's `LANGUAGES` field (see [Model Info](#model-info)). For example, a model with `en` and `fr` in its `LANGUAGES` list will have `_EN` and `_FR` columns on every translatable field and no others.

> An empty value in a language-suffixed column means no translation exists for that language.

#### Alt-label positional alignment across languages

Because `ALTLABELS` is a [list](#lists), the importer aligns labels by position across languages. Position 0 of `ALTLABELS_EN` pairs with position 0 of `ALTLABELS_FR`, and so on. Each language's list is deduplicated independently before pairing. If the lists have different lengths after deduplication, the shorter languages will have sparse entries at the trailing positions and a warning is logged.

#### Legacy unsuffixed format

The format used before multilingual support stored translatable values in unsuffixed columns, for example `PREFERREDLABEL` instead of `PREFERREDLABEL_EN`. This legacy format is still accepted on import for backwards compatibility. When the importer detects unsuffixed columns it logs a deprecation warning and maps the value to the model's fallback language (English).

> The legacy format is never produced on export. All new archives should use the suffixed format. A file must use one format consistently for all translatable fields; mixing `PREFERREDLABEL` (unsuffixed) with `DESCRIPTION_EN` (suffixed) in the same file is rejected.

#### Example skill row

Legacy (unsuffixed) format, accepted on import only:

```
ID,ORIGINURI,UUIDHISTORY,DEFINITION,SCOPENOTE,REUSELEVEL,SKILLTYPE,PREFERREDLABEL,ALTLABELS,DESCRIPTION,ISLOCALIZED,CREATEDAT,UPDATEDAT
skill-1,http://example.com/s1,uuid-1,,,sector-specific,skill/competence,Cook,"Chef\nCooker",Prepares food,false,2024-01-01T00:00:00Z,2024-01-01T00:00:00Z
```

Current (suffixed) format, produced on export (model with `en` and `fr`):

```
ID,ORIGINURI,UUIDHISTORY,DEFINITION_EN,DEFINITION_FR,SCOPENOTE_EN,SCOPENOTE_FR,REUSELEVEL,SKILLTYPE,PREFERREDLABEL_EN,PREFERREDLABEL_FR,ALTLABELS_EN,ALTLABELS_FR,DESCRIPTION_EN,DESCRIPTION_FR,ISLOCALIZED,CREATEDAT,UPDATEDAT
skill-1,http://example.com/s1,uuid-1,,,,,sector-specific,skill/competence,Cook,Cuisinier,"Chef\nCooker","Chef\nCuisinier",Prepares food,Prépare les aliments,false,2024-01-01T00:00:00Z,2024-01-01T00:00:00Z
```

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
- `occupationgroup`: Represents an [Occupation group](#occupation-groups).

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
- `LANGUAGES`: A [list](#lists) of language short codes that this model has translations for (e.g. `en` and `fr` as two newline-separated entries). The order of entries determines the order of the language-suffixed columns in all entity CSV files. Only languages present in the platform's [language registry](#languages) are accepted.
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
- `PREFERREDLABEL_<LANG>`: The preferred label of the skill. One column per language, e.g. `PREFERREDLABEL_EN`, `PREFERREDLABEL_FR`.
  - Maximum length: `256` characters.
- `ALTLABELS_<LANG>`: A [list](#lists) of alternative labels for the skill. One column per language. Labels are [aligned by position](#alt-label-positional-alignment-across-languages) across languages.
  - Maximum length per label: `256` characters.
  - Maximum number of labels: `200`.
- `DESCRIPTION_<LANG>`: The skill description. One column per language.
  - Maximum length: `6000` characters.
- `DEFINITION_<LANG>`: The skill definition. One column per language.
  - Maximum length: `4000` characters.
- `SCOPENOTE_<LANG>`: The skill scope note. One column per language.
  - Maximum length: `4000` characters.
- `ISLOCALIZED`: A boolean value that indicates whether the skill is localized or not.
  - Possible values: `true` or `false`.
- `CREATEDAT`: The [date](#dates) the skill was created.
- `UPDATEDAT`: The [date](#dates) the skill was last updated.

### Skill Groups
Contains the skill groups of the taxonomy. The export filename is `skill_groups.csv`

#### Columns
- [`ORIGINURI`](#origin-uri): A [URI](#origin-uri) that points to the location where the skill group was originally defined.
- [`ID`](#id): A [unique identifier](#id), used for referencing the skill group within the CSV dataset.
- [`UUIDHISTORY`](#uuid-history): A list of [UUIDs](#uuid-history).
- `CODE`: SkillGroup code as defined in ESCO. It has the general format `SX.X.X`, where `X` is a number.
- `PREFERREDLABEL_<LANG>`: The preferred label of the skill group. One column per language, e.g. `PREFERREDLABEL_EN`, `PREFERREDLABEL_FR`.
  - Maximum length: `256` characters.
- `ALTLABELS_<LANG>`: A [list](#lists) of alternative labels for the skill group. One column per language. Labels are [aligned by position](#alt-label-positional-alignment-across-languages) across languages.
  - Maximum length per label: `256` characters.
  - Maximum number of labels: `200`.
- `DESCRIPTION_<LANG>`: The skill group description. One column per language.
  - Maximum length: `6000` characters.
- `SCOPENOTE_<LANG>`: The skill group scope note. One column per language.
  - Maximum length: `4000` characters.
- `CREATEDAT`: The [date](#dates) the skill group was created.
- `UPDATEDAT`: The [date](#dates) the skill group was last updated.

### Occupations
Contains the occupations of the taxonomy. The export filename is `occupations.csv`

#### Columns
- [`ORIGINURI`](#origin-uri): A [URI](#origin-uri) that points to the location where the occupation was originally defined.
- [`ID`](#id): A [unique identifier](#id), used for referencing the occupation within the CSV dataset.
- [`UUIDHISTORY`](#uuid-history): A list of [UUIDs](#uuid-history).
- `OCCUPATIONGROUPCODE`:The Occupation group that the occupation belongs to.
- `CODE`: An occupation code assigned to the occupation.
  - For ESCO occupations, the code will be the parent code, followed by a `.` and any number of digits. Eg: `XXXX.1234`
  - For local occupations, the code will be the parent code, followed by an `_` and any number of digits. `XXXX_1234`
- `PREFERREDLABEL_<LANG>`: The preferred label of the occupation. One column per language, e.g. `PREFERREDLABEL_EN`, `PREFERREDLABEL_FR`.
  - Maximum length: `256` characters.
- `ALTLABELS_<LANG>`: A [list](#lists) of alternative labels for the occupation. One column per language. Labels are [aligned by position](#alt-label-positional-alignment-across-languages) across languages.
  - Maximum length per label: `256` characters.
  - Maximum number of labels: `200`.
- `DESCRIPTION_<LANG>`: The occupation description. One column per language.
  - Maximum length: `6000` characters.
- `DEFINITION_<LANG>`: The occupation definition. One column per language.
  - Maximum length: `4000` characters.
- `SCOPENOTE_<LANG>`: The occupation scope note. One column per language.
  - Maximum length: `4000` characters.
- `REGULATEDPROFESSIONNOTE_<LANG>`: The regulated profession note. One column per language.
  - Maximum length: `4000` characters.
- `OCCUPATIONTYPE`: The type of the occupation. 
  - Possible values: `escooccupation` or `localoccupation`.
- `ISLOCALIZED`: A boolean value that indicates whether the occupation is localized or not. Only occupations of the type `escooccupation` can be localized.
  - Possible values: `true` or `false`.
- `CREATEDAT`: The [date](#dates) the occupation was created.
- `UPDATEDAT`: The [date](#dates) the occupation was last updated.

### Occupation Groups
Contains the Occupation groups of the taxonomy. The export filename is `occupation_groups.csv`

#### Columns
- [`ORIGINURI`](#origin-uri): A [URI](#origin-uri) that points to the location where the Occupation group was originally defined.
- [`ID`](#id): A [unique identifier](#id), used for referencing the Occupation group within the CSV dataset.
- [`UUIDHISTORY`](#uuid-history): A list of [UUIDs](#uuid-history).
- `CODE`: A four digit identification code of the Occupation group. Each digit represents a level in the hierarchy.
  - For ISCO groups, the code is a maximum of 4 digits, and each child group should have a code that begins with the parent group code. Eg: `1234`
  - For local groups without a parent group, the code should start with an alphabetical character. Eg: `A1234`
  - For local groups, if the parent occupation group is an isco group, the code should start with the parent group code and then have one alphabetical character. Eg: `1234A`
  - For local groups, if the parent occupation group is also a local group, the code should start with the parent group code and then have either an alphabetical character or a number. Eg: `1234AB` or `1234A1`
- `GROUPTYPE`: The type of the Occupation group.
  - Possible values: `iscogroup` or `localgroup`.
- `PREFERREDLABEL_<LANG>`: The preferred label of the Occupation group. One column per language, e.g. `PREFERREDLABEL_EN`, `PREFERREDLABEL_FR`.
  - Maximum length: `256` characters.
- `ALTLABELS_<LANG>`: A [list](#lists) of alternative labels for the Occupation group. One column per language. Labels are [aligned by position](#alt-label-positional-alignment-across-languages) across languages.
  - Maximum length per label: `256` characters.
  - Maximum number of labels: `200`.
- `DESCRIPTION_<LANG>`: The Occupation group description. One column per language.
  - Maximum length: `6000` characters.
- `CREATEDAT`: The [date](#dates) the Occupation group was created.
- `UPDATEDAT`: The [date](#dates) the Occupation group was last updated.

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
  - Possible values: `essential`, `optional`, or it can be left empty. 
- `SIGNALLINGVALUELABEL`: The signalling value label of the relation.
  - Possible values: `low`, `medium`, `high`, or it can be left empty.
- `SIGNALLINGVALUE`: The signalling value of the relation.
  - A number between `0` and `1`, or it can be left empty. The only allowed delimiter for decimal numbers is a `.`.
- `SKILLID`: The  [`ID`](#id) of the skill.
- `CREATEDAT`: The [date](#dates) the relation was created.
- `UPDATEDAT`: The [date](#dates) the relation was last updated.

> Caveat: An escooccuption cannot have a `signalling value` or `signalling value label`. It **must** have a `relationType`.
> For localoccupations `signalling value` and `relationType` are mutually exclusive. A `localoccupation` can **either** have a `signalling value` and `signalling value label` **or** it can have a `relationType`, but not both.

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
  - Possible values: `occupationgroup`, `escooccupation`, `localoccupation`.
- `PARENTID`: The  [`ID`](#id) of the parent object.
- `CHILDID`: The  [`ID`](#id) of the child object.
- `CHILDOBJECTTYPE`: The type of the child object.
  - Possible values: `occupationgroup`, `escooccupation`, `localoccupation`.
- `CREATEDAT`: The [date](#dates) the relation was created.
- `UPDATEDAT`: The [date](#dates) the relation was last updated.

> Caveat: An `escooccupation` cannot be the parent of an 'occupationgroup'.
> Caveat: An `localoccupation` can be a child of an `escooccupation` or another `localoccupation`.

### LICENSE
Contains the license information for the model. If one wants to add a license to the dataset, it can be added to a file named `LICENSE` in the root of the dataset.
The `LICENSE` file supports plain text and Markdown format. During export the license information of the model will also be exported in the `LICENSE` file.