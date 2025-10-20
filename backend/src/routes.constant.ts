export const Routes = {
  APPLICATION_INFO_ROUTE: "/info",
  MODELS_ROUTE: "/models",
  PRESIGNED_ROUTE: "/presigned",
  IMPORT_ROUTE: "/import",
  EXPORT_ROUTE: "/export",
  OCCUPATION_GROUPS_ROUTE: /^\/models\/([0-9a-f]{24})\/occupationGroups$/,
  OCCUPATIONS_ROUTE: /^\/models\/([0-9a-f]{24})\/occupations$/,
  OCCUPATION_BY_ID_ROUTE: /^\/models\/([0-9a-f]{24})\/occupations\/([0-9a-f]{24})$/,
};
