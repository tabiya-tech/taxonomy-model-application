## Taxonomy Hierarchy

The taxonomy hierarchy is a tree structure that represents the relationships between the different entities in the taxonomy. 
There are 2 types of hierarchies in a taxonomy:
1. [`Occupation Hierarchy`](backend/Import_Export_CSV_format.md#occupation-hierarchy): A hierarchy between Occupation Groups and occupations.
2. [`Skill Hierarchy`](backend/Import_Export_CSV_format.md#skill-hierarchy): A hierarchy between SkillGroups and Skills.

### Occupation Hierarchy
The Occupation Hierarchy is a tree structure that represents the occupations in the taxonomy and the groups they belong to. 
An occupation group can be the child of another occupation group. Similarly, an Occupation can be the child of an Occupation Group or another Occupation.

There are 2 types of Occupation Groups, `ISCO Groups` and `Local Groups`.
- `ISCO Groups` are the groups defined by the International Standard Classification of Occupations (ISCO).
- `Local Groups` are the groups defined outside the ISCO classification. They can be groups defined under a different classification like `ICATUS` (International Classification of Activities for Time-Use Statistics).
Or they could simply be groups defined specifically for one taxonomy or locale.

There are also 2 types of Occupations, `ESCO Occupations` and `Local Occupations`.
- `ESCO Occupations` are the occupations defined by the European Skills, Competences, Qualifications and Occupations (ESCO) classification.
- `Local Occupations` are the occupations defined outside the ESCO classification. They are usually defined specifically for one taxonomy or locale.

The valid entity relationships in the Occupation Hierarchy are:
- ISCO Group -> ISCO Group
- ISCO Group -> Local Group
- Local Group -> Local Group
- ISCO Group -> ESCO Occupation
- ISCO Group -> Local Occupation
- Local Group -> Local Occupation
- ESCO Occupation -> ESCO Occupation
- ESCO Occupation -> Local Occupation


When constructing an occupation hierarchy, the following rules have to be followed:
- Occupation hierarchies are built such that entities can only have `one parent but can have multiple children.`
- The `CODE` property of a child should always start with the code of its parent.

#### Rules for Occupation Groups
- The code property for an Occupation Group should be unique to that group.
- ISCO Groups can be parent to ISCO Groups and Local Groups. Local Groups can be parent to Local Groups and Occupations.
- ISCO Groups cannot be children of Local Groups.
- For ISCO Groups, the `CODE` property should not be longer that 4-digits. Each digit represents a level in the hierarchy.
  - Example: `ISCO Group` with `CODE` `1` can have a child `ISCO Group` with `CODE` `11`.
  - `There can only be upto 4 levels of ISCO Groups`.
- An ISCO Group that is the child of another ISCO Group should have a `CODE` that is its parent code followed by a single numeric digit. (No alphabetic characters)
  - Example: `ISCO Group` with `CODE` `1` can have a child `ISCO Group` with `CODE` `11`.
- A Local Group that is the child of another Local Group should have a `CODE` that is its parent code followed by a single alphabetic or numeric character.
  - Example: `Local Group` with `CODE` `A` can have a child `Local Group` with `CODE` `AA`.
- A Local Group that is the child of an ISCO Group should have a `CODE` that is its parent code followed by a single alphabetic character. (No numeric characters)
  - Example: `ISCO Group` with `CODE` `1` can have a child `Local Group` with `CODE` `1A`.
- `Local Groups do not have a limit on the number of levels`.

#### Rules for Occupations
- The code property for an Occupation should be unique to that occupation.
- Occupations can only be the children of ISCO Groups if the ISCO Group in question is a leaf node, i.e. the ISCO Group is on level 4 of its hierarchy, and its code is `4 digits` long.
  - Example: `ISCO Group` with `CODE` `1111` can have a child `ESCO Occupation` with `CODE` `1111.1`.
  - An `ISCO Group` with `CODE` `111` `CAN NOT` have a child `ESCO Occupation`
- ESCO Occupations can only be the children of ISCO Groups or other ESCO Occupations.
- Local Occupations can be the children of ISCO Groups, Local Groups or ESCO Occupations or other Local Occupations.
- For ESCO Occupations, the `CODE` property should be the parent code followed by a "." and one or more numeric digits.
  - Example: `ESCO Occupation` with `CODE` `1` can have a child `ESCO Occupation` with `CODE` `1.1`.
- For Local Occupations, the `CODE` property should be the parent code followed by a "_" and one or more alphabetic or numeric characters.
  - Example: `Local Occupation` with `CODE` `A` can have a child `Local Occupation` with `CODE` `A_A`.

A representative occupation hierarchy with ISCO Groups, Local Groups, ESCO Occupations and Local Occupations and allowed and disallowed relationships can be found below:

![Occupation Hierarchy](https://lucid.app/publicSegments/view/8d6d1a3c-b6a5-426c-9ad4-73041b3d9dc6/image.png)

### Skill Hierarchy

The Skill Hierarchy is a tree structure that represents the skills in the taxonomy and the skill groups they belong to.
A skill group can be the child of another skill group. A skill can be the child of a skill group or another skill.

The valid entity relationships in the Skill Hierarchy are:
- Skill Group -> Skill Group
- Skill Group -> Skill
- Skill -> Skill

When constructing an occupation hierarchy, the following rules have to be followed:
> Skill hierarchies are built such that entities can only have one parent but can have multiple children.
