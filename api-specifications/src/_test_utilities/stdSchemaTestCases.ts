import { CaseType, constructSchemaError, SchemaError } from "./assertCaseForProperty";
import { getTestString, WHITESPACE } from "./specialCharacters";
import { getMockId } from "./mockMongoId";
import { randomUUID } from "crypto";

function getCanonicalPath(instancePath: string): {
  propertyName: string;
  canonicalPropertyPath: string;
  canonicalParentPath: string;
  canonicalChildPath: string;
} {
  const canonicalPropertyPath = instancePath.startsWith("/") ? instancePath : "/" + instancePath;
  // extract the property name and the parent path
  const propertyName = canonicalPropertyPath.substring(
    canonicalPropertyPath.lastIndexOf("/") + 1,
    canonicalPropertyPath.length
  );
  const canonicalParentPath = canonicalPropertyPath.substring(0, canonicalPropertyPath.lastIndexOf("/"));
  const canonicalChildPath = `${canonicalParentPath}/${propertyName}`;
  return {
    propertyName,
    canonicalPropertyPath,
    canonicalParentPath,
    canonicalChildPath,
  };
}

export function getStdTimestampFieldTestCases(
  instancePath: string
): [CaseType, string, unknown, ReturnType<typeof constructSchemaError> | undefined][] {
  const { propertyName, canonicalPropertyPath, canonicalParentPath, canonicalChildPath } =
    getCanonicalPath(instancePath);

  return [
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError(canonicalParentPath, "required", `must have required property '${propertyName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(canonicalChildPath, "type", "must be string")],
    [
      CaseType.Failure,
      "only whitespace characters",
      WHITESPACE,
      constructSchemaError(canonicalPropertyPath, "format", 'must match format "date-time"'),
    ],
    [
      CaseType.Failure,
      "random string",
      "foo",
      constructSchemaError(canonicalPropertyPath, "format", 'must match format "date-time"'),
    ],
    [
      CaseType.Failure,
      "non string date",
      new Date(),
      constructSchemaError(canonicalPropertyPath, "type", "must be string"),
    ],
    [
      CaseType.Failure,
      "a valid UTCString date",
      new Date().toUTCString(),
      constructSchemaError(canonicalPropertyPath, "format", 'must match format "date-time"'),
    ],
    [
      CaseType.Failure,
      "a valid DateString date",
      new Date().toDateString(),
      constructSchemaError(canonicalPropertyPath, "format", 'must match format "date-time"'),
    ],
    [CaseType.Success, "a valid ISOString date", new Date().toISOString(), undefined],
  ];
}

export function getStdObjectIdTestCases(
  instancePath: string
): [CaseType, string, string | null | undefined, SchemaError | undefined][] {
  const { propertyName, canonicalParentPath, canonicalChildPath } = getCanonicalPath(instancePath);
  return [
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError(canonicalParentPath, "required", `must have required property '${propertyName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(`${canonicalChildPath}`, "type", "must be string")],
    [
      CaseType.Failure,
      "only whitespace characters",
      WHITESPACE,
      constructSchemaError(instancePath, "pattern", 'must match pattern "^[0-9a-f]{24}$"'),
    ],
    [
      CaseType.Failure,
      "random string",
      "foo",
      constructSchemaError(instancePath, "pattern", 'must match pattern "^[0-9a-f]{24}$"'),
    ],
    [CaseType.Success, "a valid id", getMockId(1), undefined],
  ];
}

export function getStdURIOrURNFieldTestCases(
  instancePath: string,
  maxLength: number,
  allowEmpty?: boolean
): [CaseType, string, string | null | undefined, SchemaError | undefined][] {
  const { propertyName, canonicalPropertyPath, canonicalParentPath, canonicalChildPath } =
    getCanonicalPath(instancePath);

  const emptyTestCase = allowEmpty
    ? [CaseType.Success, "empty string", "", undefined]
    : [
        CaseType.Failure,
        "empty string",
        "",
        constructSchemaError(canonicalPropertyPath, "anyOf", "must match a schema in anyOf"),
      ];
  return [
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError(canonicalParentPath, "required", `must have required property '${propertyName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(canonicalChildPath, "type", "must be string")],
    [
      CaseType.Failure,
      `Too long ${propertyName}`,
      getTestString(maxLength + 1),
      constructSchemaError(canonicalPropertyPath, "maxLength", `must NOT have more than ${maxLength} characters`),
    ],
    [
      CaseType.Failure,
      "only whitespace characters",
      WHITESPACE,
      constructSchemaError(canonicalPropertyPath, "anyOf", "must match a schema in anyOf"),
    ],
    [
      CaseType.Failure,
      "random string",
      "foo",
      constructSchemaError(canonicalPropertyPath, "anyOf", "must match a schema in anyOf"),
    ],
    // @ts-ignore
    emptyTestCase,
    [
      CaseType.Failure,
      "a valid HTTP URL",
      "http://foo.bar.com",
      constructSchemaError(canonicalPropertyPath, "anyOf", "must match a schema in anyOf"),
    ],
    [
      CaseType.Failure,
      "a valid FTP URL",
      "ftp://foo.bar.com",
      constructSchemaError(canonicalPropertyPath, "anyOf", "must match a schema in anyOf"),
    ],
    [CaseType.Success, "a valid HTTPS URL", "https://www.example.com", undefined],
    [CaseType.Success, "a valid complex HTTPS URL", "https://u:p@foo.bar.com:8080/%25?25#%25", undefined],

    // --- URN-specific checks ---
    [CaseType.Success, "a valid URN", "urn:isbn:0451450523", undefined],
    [CaseType.Success, "a valid URN with UUID", "urn:uuid:123e4567-e89b-12d3-a456-426614174000", undefined],
    [
      CaseType.Failure,
      "invalid URN format",
      "urn://not.valid",
      constructSchemaError(canonicalPropertyPath, "anyOf", "must match a schema in anyOf"),
    ],
  ];
}

export function getStdURIFieldTestCases(
  instancePath: string,
  maxLength: number,
  allowEmpty?: boolean
): [CaseType, string, string | null | undefined, SchemaError | undefined][] {
  const { propertyName, canonicalPropertyPath, canonicalParentPath, canonicalChildPath } =
    getCanonicalPath(instancePath);
  const emptyTestCase = allowEmpty
    ? [CaseType.Success, "empty string", "", undefined]
    : [
        CaseType.Failure,
        "empty string",
        "",
        constructSchemaError(canonicalPropertyPath, "format", 'must match format "uri"'),
      ];

  return [
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError(canonicalParentPath, "required", `must have required property '${propertyName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(canonicalChildPath, "type", "must be string")],
    [
      CaseType.Failure,
      `Too long ${propertyName}`,
      getTestString(maxLength + 1),
      constructSchemaError(canonicalPropertyPath, "maxLength", `must NOT have more than ${maxLength} characters`),
    ],
    [
      CaseType.Failure,
      "only whitespace characters",
      WHITESPACE,
      constructSchemaError(canonicalPropertyPath, "format", 'must match format "uri"'),
    ],
    [
      CaseType.Failure,
      "random string",
      "foo",
      constructSchemaError(canonicalPropertyPath, "format", 'must match format "uri"'),
    ],
    // @ts-ignore
    emptyTestCase,
    [
      CaseType.Failure,
      "a valid HTTP URL",
      "http://foo.bar.com",
      constructSchemaError(canonicalPropertyPath, "pattern", 'must match pattern "^https://.*"'),
    ],
    [
      CaseType.Failure,
      "a valid FTP URL",
      "ftp://foo.bar.com",
      constructSchemaError(canonicalPropertyPath, "pattern", 'must match pattern "^https://.*"'),
    ],
    [
      CaseType.Failure,
      "SMTP URL",
      "smtp://smtp.foo.bar.com",
      constructSchemaError(canonicalPropertyPath, "pattern", 'must match pattern "^https://.*"'),
    ],
    [CaseType.Success, "a valid HTTPS URL", "https://www.example.com", undefined],
    [CaseType.Success, "a valid complex HTTPS URL", "https://u:p@foo.bar.com:8080/%25?25#%25", undefined],
  ];
}

export function getStdEnumTestCases(
  instancePath: string,
  validEnum: string[]
): [CaseType, string, string | null | undefined, SchemaError | undefined][] {
  const { propertyName, canonicalParentPath, canonicalChildPath } = getCanonicalPath(instancePath);
  return [
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError(canonicalParentPath, "required", `must have required property '${propertyName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(`${canonicalChildPath}`, "type", "must be string")],
    [
      CaseType.Failure,
      "only whitespace characters",
      WHITESPACE,
      constructSchemaError(`${canonicalChildPath}`, "enum", "must be equal to one of the allowed values"),
    ],
    [
      CaseType.Failure,
      "random string",
      "foo",
      constructSchemaError(`${canonicalChildPath}`, "enum", "must be equal to one of the allowed values"),
    ],
    // @ts-ignore
    ...validEnum.map((value) => [CaseType.Success, value, value, undefined]),
  ];
}

export function getStdUUIDTestCases(
  instancePath: string
): [CaseType, string, string | null | undefined, SchemaError | undefined][] {
  const { propertyName, canonicalParentPath, canonicalChildPath } = getCanonicalPath(instancePath);

  return [
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError(canonicalParentPath, "required", `must have required property '${propertyName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(canonicalChildPath, "type", "must be string")],
    [
      CaseType.Failure,
      "empty",
      "",
      constructSchemaError(
        canonicalChildPath,
        "pattern",
        'must match pattern "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"'
      ),
    ],
    [
      CaseType.Failure,
      "only whitespace characters",
      WHITESPACE,
      constructSchemaError(
        canonicalChildPath,
        "pattern",
        'must match pattern "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"'
      ),
    ],
    [
      CaseType.Failure,
      "not a UUID v4",
      "foo",
      constructSchemaError(
        canonicalChildPath,
        "pattern",
        'must match pattern "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"'
      ),
    ],
    [CaseType.Success, "Valid UUID", randomUUID(), undefined],
  ];
}

export function getStdNonEmptyURIStringTestCases(
  instancePath: string,
  maxLength: number
): [CaseType, string, string | null | undefined, SchemaError | undefined][] {
  const { propertyName, canonicalParentPath, canonicalChildPath } = getCanonicalPath(instancePath);
  return [
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError(canonicalParentPath, "required", `must have required property '${propertyName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(canonicalChildPath, "type", "must be string")],
    [CaseType.Failure, "empty", "", constructSchemaError(canonicalChildPath, "pattern", 'must match pattern "\\S"')],
    [
      CaseType.Failure,
      `Too long ${propertyName}`,
      getTestString(maxLength + 1),
      constructSchemaError(canonicalChildPath, "maxLength", `must NOT have more than ${maxLength} characters`),
    ],
    [
      CaseType.Failure,
      "only whitespace characters",
      WHITESPACE,
      constructSchemaError(canonicalChildPath, "pattern", 'must match pattern "\\S"'),
    ],
    [CaseType.Success, "a valid URI", "http://foo.com", undefined],
    [CaseType.Success, "a valid URN", "urn:isbn:0451450523", undefined],
  ];
}

export function getStdNonEmptyStringTestCases(
  instancePath: string,
  maxLength: number
): [CaseType, string, string | null | undefined, SchemaError | undefined][] {
  const { propertyName, canonicalParentPath, canonicalChildPath } = getCanonicalPath(instancePath);
  return [
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError(canonicalParentPath, "required", `must have required property '${propertyName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(canonicalChildPath, "type", "must be string")],
    [CaseType.Failure, "empty", "", constructSchemaError(canonicalChildPath, "pattern", 'must match pattern "\\S"')],
    [
      CaseType.Failure,
      `Too long ${propertyName}`,
      getTestString(maxLength + 1),
      constructSchemaError(canonicalChildPath, "maxLength", `must NOT have more than ${maxLength} characters`),
    ],
    [
      CaseType.Failure,
      "only whitespace characters",
      WHITESPACE,
      constructSchemaError(canonicalChildPath, "pattern", 'must match pattern "\\S"'),
    ],
    [CaseType.Success, "a valid string", "foo", undefined],
    [CaseType.Success, "the longest", getTestString(maxLength), undefined],
  ];
}

export function getStdStringTestCases(
  instancePath: string,
  maxLength: number
): [CaseType, string, string | null | undefined, SchemaError | undefined][] {
  const { propertyName, canonicalParentPath, canonicalChildPath } = getCanonicalPath(instancePath);
  return [
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError(canonicalParentPath, "required", `must have required property '${propertyName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(canonicalChildPath, "type", "must be string")],
    [
      CaseType.Failure,
      `Too long ${propertyName}`,
      getTestString(maxLength + 1),
      constructSchemaError(canonicalChildPath, "maxLength", `must NOT have more than ${maxLength} characters`),
    ],
    [CaseType.Success, "empty", "", undefined],
    [CaseType.Success, "only whitespace characters", WHITESPACE, undefined],
    [CaseType.Success, "one character", "a", undefined],
    [CaseType.Success, "the longest", getTestString(maxLength), undefined],
  ];
}
