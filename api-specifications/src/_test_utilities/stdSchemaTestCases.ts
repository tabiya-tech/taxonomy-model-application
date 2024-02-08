import { CaseType, constructSchemaError, SchemaError } from "./assertCaseForProperty";
import { getTestString, WHITESPACE } from "./specialCharacters";
import { getMockId } from "./mockMongoId";

export function getStdTimestampFieldTestCases(
  instancePath: string
): [CaseType, string, unknown, ReturnType<typeof constructSchemaError> | undefined][] {
  const canonicalPropertyPath = instancePath.startsWith("/") ? instancePath : "/" + instancePath;
  // extract the property name and the parent path
  const propertyName = canonicalPropertyPath.substring(
    canonicalPropertyPath.lastIndexOf("/") + 1,
    canonicalPropertyPath.length
  );
  const canonicalParentPath = canonicalPropertyPath.substring(0, canonicalPropertyPath.lastIndexOf("/"));
  const canonicalChildPath = `${canonicalParentPath}/${propertyName}`;

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
  const canonicalPropertyPath = instancePath.startsWith("/") ? instancePath : "/" + instancePath;
  // extract the property name and the parent path
  const propertyName = canonicalPropertyPath.substring(
    canonicalPropertyPath.lastIndexOf("/") + 1,
    canonicalPropertyPath.length
  );
  const canonicalParentPath = canonicalPropertyPath.substring(0, canonicalPropertyPath.lastIndexOf("/"));
  const canonicalChildPath = `${canonicalParentPath}/${propertyName}`;
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

export function getStdURIFieldTestCases(
  instancePath: string,
  maxLength: number,
  allowEmpty?: boolean
): [CaseType, string, string | null | undefined, SchemaError | undefined][] {
  const canonicalPropertyPath = instancePath.startsWith("/") ? instancePath : "/" + instancePath;
  // extract the property name and the parent path
  const propertyName = canonicalPropertyPath.substring(
    canonicalPropertyPath.lastIndexOf("/") + 1,
    canonicalPropertyPath.length
  );
  const canonicalParentPath = canonicalPropertyPath.substring(0, canonicalPropertyPath.lastIndexOf("/"));
  const canonicalChildPath = `${canonicalParentPath}/${propertyName}`;
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
  const canonicalPropertyPath = instancePath.startsWith("/") ? instancePath : "/" + instancePath;
  // extract the property name and the parent path
  const propertyName = canonicalPropertyPath.substring(
    canonicalPropertyPath.lastIndexOf("/") + 1,
    canonicalPropertyPath.length
  );
  const canonicalParentPath = canonicalPropertyPath.substring(0, canonicalPropertyPath.lastIndexOf("/"));
  const canonicalChildPath = `${canonicalParentPath}/${propertyName}`;
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
