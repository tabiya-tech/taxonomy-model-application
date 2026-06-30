export function parseBooleanQueryParam(value: string | undefined) {
  return value?.toLocaleLowerCase() == "true";
}
