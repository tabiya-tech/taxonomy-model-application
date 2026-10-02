import { useLanguage } from "src/language/LanguageProvider";
import { DEFAULT_LANGUAGE } from "src/language/languages.service";

/** The UI texts of the explorer, translated per display language. */
export type ExplorerTranslations = {
  // Header
  BACK_TO_DIRECTORY: string;
  SELECT_TAXONOMY_VERSION: string;
  SELECT_LANGUAGE: string;
  SWITCH_MODEL: string;
  UNKNOWN_LOCALE: string;
  NO_MODELS_AVAILABLE: string;
  MODEL_NOT_FOUND: string;
  CSV_DOWNLOAD_TOOLTIP: string;
  CSV_UNAVAILABLE_TOOLTIP: string;

  // Tree panel
  TAB_OCCUPATIONS: string;
  TAB_SKILLS: string;
  SEARCH_OCCUPATIONS_PLACEHOLDER: string;
  SEARCH_SKILLS_PLACEHOLDER: string;
  NO_OCCUPATIONS_FOUND: string;
  NO_SKILLS_FOUND: string;
  SEEN_ECONOMY_GROUP: string;
  UNSEEN_ECONOMY_GROUP: string;

  // Detail panel: empty state
  SELECT_AN_ITEM: string;

  // Detail panel: tabs
  TAB_DEFINITION: string;
  TAB_SKILLS_LINKED: string;
  TAB_OCCUPATIONS_LINKED: string;
  TAB_LINKS: string;
  TAB_DETAILS: string;
  TAB_HISTORY: string;

  // Detail panel: badges
  BADGE_GROUP: string;
  BADGE_SEEN_ECONOMY: string;
  BADGE_UNSEEN_ECONOMY: string;
  BADGE_SKILL: string;
  SKILL_TYPE_SKILL_COMPETENCE: string;
  SKILL_TYPE_KNOWLEDGE: string;
  SKILL_TYPE_LANGUAGE: string;
  SKILL_TYPE_ATTITUDE: string;

  // Detail panel: definition tab
  DESCRIPTION: string;
  NO_DEFINITION_AVAILABLE: string;
  ALSO_KNOWN_AS: string;
  CONTAINS: string;
  EMPTY_GROUP: string;

  // Detail panel: links tab
  NO_LINKS_AVAILABLE: string;
  ESSENTIAL_SKILLS: string;
  OPTIONAL_SKILLS: string;
  OCCUPATIONS_REQUIRING_THIS_SKILL: string;

  // Detail panel: details tab
  DETAIL_TYPE: string;
  DETAIL_CODE: string;
  DETAIL_CHILDREN: string;
  DETAIL_ALTERNATIVE_LABELS: string;
  TYPE_OCCUPATION_GROUP: string;
  TYPE_SKILL_GROUP: string;
  TYPE_ESCO_OCCUPATION: string;
  TYPE_LOCAL_OCCUPATION: string;
  TYPE_SKILL: string;

  // Detail panel: history tab
  NO_HISTORY_AVAILABLE: string;
};

const EN: ExplorerTranslations = {
  BACK_TO_DIRECTORY: "All taxonomies",
  SELECT_TAXONOMY_VERSION: "Select taxonomy version",
  SELECT_LANGUAGE: "Select display language",
  SWITCH_MODEL: "SWITCH MODEL",
  UNKNOWN_LOCALE: "Unknown Locale",
  NO_MODELS_AVAILABLE: "No Models available",
  MODEL_NOT_FOUND: "Model not found",
  CSV_DOWNLOAD_TOOLTIP: "Download the taxonomy as CSV",
  CSV_UNAVAILABLE_TOOLTIP: "No CSV export is available for this taxonomy yet",

  TAB_OCCUPATIONS: "Occupations",
  TAB_SKILLS: "Skills",
  SEARCH_OCCUPATIONS_PLACEHOLDER: "Search occupations...",
  SEARCH_SKILLS_PLACEHOLDER: "Search skills...",
  NO_OCCUPATIONS_FOUND: "No occupations found",
  NO_SKILLS_FOUND: "No skills found",
  SEEN_ECONOMY_GROUP: "Seen economy · ESCO",
  UNSEEN_ECONOMY_GROUP: "Unseen economy · ICATUS",

  SELECT_AN_ITEM: "Select an item to view its details",

  TAB_DEFINITION: "Definition",
  TAB_SKILLS_LINKED: "Skills linked",
  TAB_OCCUPATIONS_LINKED: "Occupations linked",
  TAB_LINKS: "Links",
  TAB_DETAILS: "Details",
  TAB_HISTORY: "History",

  BADGE_GROUP: "Group",
  BADGE_SEEN_ECONOMY: "Seen Economy",
  BADGE_UNSEEN_ECONOMY: "Unseen Economy",
  BADGE_SKILL: "Skill",
  SKILL_TYPE_SKILL_COMPETENCE: "Skill/competence",
  SKILL_TYPE_KNOWLEDGE: "Knowledge",
  SKILL_TYPE_LANGUAGE: "Language",
  SKILL_TYPE_ATTITUDE: "Attitude",

  DESCRIPTION: "Description",
  NO_DEFINITION_AVAILABLE: "No definition available",
  ALSO_KNOWN_AS: "Also known as",
  CONTAINS: "Contains",
  EMPTY_GROUP: "Empty group.",

  NO_LINKS_AVAILABLE: "No links available for this item.",
  ESSENTIAL_SKILLS: "Essential skills",
  OPTIONAL_SKILLS: "Optional skills",
  OCCUPATIONS_REQUIRING_THIS_SKILL: "Occupations requiring this skill",

  DETAIL_TYPE: "Type",
  DETAIL_CODE: "Code",
  DETAIL_CHILDREN: "Children",
  DETAIL_ALTERNATIVE_LABELS: "Alternative labels",
  TYPE_OCCUPATION_GROUP: "Occupation group",
  TYPE_SKILL_GROUP: "Skill group",
  TYPE_ESCO_OCCUPATION: "ESCO occupation",
  TYPE_LOCAL_OCCUPATION: "Local occupation",
  TYPE_SKILL: "Skill",

  NO_HISTORY_AVAILABLE: "No history available.",
};

const FR: ExplorerTranslations = {
  BACK_TO_DIRECTORY: "Toutes les taxonomies",
  SELECT_TAXONOMY_VERSION: "Sélectionner la version de la taxonomie",
  SELECT_LANGUAGE: "Sélectionner la langue d'affichage",
  SWITCH_MODEL: "CHANGER DE MODÈLE",
  UNKNOWN_LOCALE: "Région inconnue",
  NO_MODELS_AVAILABLE: "Aucun modèle disponible",
  MODEL_NOT_FOUND: "Modèle introuvable",
  CSV_DOWNLOAD_TOOLTIP: "Télécharger la taxonomie au format CSV",
  CSV_UNAVAILABLE_TOOLTIP: "Aucun export CSV n'est encore disponible pour cette taxonomie",

  TAB_OCCUPATIONS: "Professions",
  TAB_SKILLS: "Compétences",
  SEARCH_OCCUPATIONS_PLACEHOLDER: "Rechercher des professions...",
  SEARCH_SKILLS_PLACEHOLDER: "Rechercher des compétences...",
  NO_OCCUPATIONS_FOUND: "Aucune profession trouvée",
  NO_SKILLS_FOUND: "Aucune compétence trouvée",
  SEEN_ECONOMY_GROUP: "Économie visible · ESCO",
  UNSEEN_ECONOMY_GROUP: "Économie invisible · ICATUS",

  SELECT_AN_ITEM: "Sélectionnez un élément pour afficher ses détails",

  TAB_DEFINITION: "Définition",
  TAB_SKILLS_LINKED: "Compétences liées",
  TAB_OCCUPATIONS_LINKED: "Professions liées",
  TAB_LINKS: "Liens",
  TAB_DETAILS: "Détails",
  TAB_HISTORY: "Historique",

  BADGE_GROUP: "Groupe",
  BADGE_SEEN_ECONOMY: "Économie visible",
  BADGE_UNSEEN_ECONOMY: "Économie invisible",
  BADGE_SKILL: "Compétence",
  SKILL_TYPE_SKILL_COMPETENCE: "Aptitude/compétence",
  SKILL_TYPE_KNOWLEDGE: "Connaissance",
  SKILL_TYPE_LANGUAGE: "Langue",
  SKILL_TYPE_ATTITUDE: "Attitude",

  DESCRIPTION: "Description",
  NO_DEFINITION_AVAILABLE: "Aucune définition disponible",
  ALSO_KNOWN_AS: "Également appelé",
  CONTAINS: "Contient",
  EMPTY_GROUP: "Groupe vide.",

  NO_LINKS_AVAILABLE: "Aucun lien disponible pour cet élément.",
  ESSENTIAL_SKILLS: "Compétences essentielles",
  OPTIONAL_SKILLS: "Compétences optionnelles",
  OCCUPATIONS_REQUIRING_THIS_SKILL: "Professions requérant cette compétence",

  DETAIL_TYPE: "Type",
  DETAIL_CODE: "Code",
  DETAIL_CHILDREN: "Enfants",
  DETAIL_ALTERNATIVE_LABELS: "Libellés alternatifs",
  TYPE_OCCUPATION_GROUP: "Groupe de professions",
  TYPE_SKILL_GROUP: "Groupe de compétences",
  TYPE_ESCO_OCCUPATION: "Profession ESCO",
  TYPE_LOCAL_OCCUPATION: "Profession locale",
  TYPE_SKILL: "Compétence",

  NO_HISTORY_AVAILABLE: "Aucun historique disponible.",
};

const ES: ExplorerTranslations = {
  BACK_TO_DIRECTORY: "Todas las taxonomías",
  SELECT_TAXONOMY_VERSION: "Seleccionar la versión de la taxonomía",
  SELECT_LANGUAGE: "Seleccionar el idioma de visualización",
  SWITCH_MODEL: "CAMBIAR DE MODELO",
  UNKNOWN_LOCALE: "Región desconocida",
  NO_MODELS_AVAILABLE: "No hay modelos disponibles",
  MODEL_NOT_FOUND: "Modelo no encontrado",
  CSV_DOWNLOAD_TOOLTIP: "Descargar la taxonomía en formato CSV",
  CSV_UNAVAILABLE_TOOLTIP: "Todavía no hay una exportación CSV disponible para esta taxonomía",

  TAB_OCCUPATIONS: "Ocupaciones",
  TAB_SKILLS: "Habilidades",
  SEARCH_OCCUPATIONS_PLACEHOLDER: "Buscar ocupaciones...",
  SEARCH_SKILLS_PLACEHOLDER: "Buscar habilidades...",
  NO_OCCUPATIONS_FOUND: "No se encontraron ocupaciones",
  NO_SKILLS_FOUND: "No se encontraron habilidades",
  SEEN_ECONOMY_GROUP: "Economía visible · ESCO",
  UNSEEN_ECONOMY_GROUP: "Economía invisible · ICATUS",

  SELECT_AN_ITEM: "Seleccione un elemento para ver sus detalles",

  TAB_DEFINITION: "Definición",
  TAB_SKILLS_LINKED: "Habilidades vinculadas",
  TAB_OCCUPATIONS_LINKED: "Ocupaciones vinculadas",
  TAB_LINKS: "Vínculos",
  TAB_DETAILS: "Detalles",
  TAB_HISTORY: "Historial",

  BADGE_GROUP: "Grupo",
  BADGE_SEEN_ECONOMY: "Economía visible",
  BADGE_UNSEEN_ECONOMY: "Economía invisible",
  BADGE_SKILL: "Habilidad",
  SKILL_TYPE_SKILL_COMPETENCE: "Habilidad/competencia",
  SKILL_TYPE_KNOWLEDGE: "Conocimiento",
  SKILL_TYPE_LANGUAGE: "Idioma",
  SKILL_TYPE_ATTITUDE: "Actitud",

  DESCRIPTION: "Descripción",
  NO_DEFINITION_AVAILABLE: "No hay una definición disponible",
  ALSO_KNOWN_AS: "También conocido como",
  CONTAINS: "Contiene",
  EMPTY_GROUP: "Grupo vacío.",

  NO_LINKS_AVAILABLE: "No hay vínculos disponibles para este elemento.",
  ESSENTIAL_SKILLS: "Habilidades esenciales",
  OPTIONAL_SKILLS: "Habilidades opcionales",
  OCCUPATIONS_REQUIRING_THIS_SKILL: "Ocupaciones que requieren esta habilidad",

  DETAIL_TYPE: "Tipo",
  DETAIL_CODE: "Código",
  DETAIL_CHILDREN: "Hijos",
  DETAIL_ALTERNATIVE_LABELS: "Etiquetas alternativas",
  TYPE_OCCUPATION_GROUP: "Grupo de ocupaciones",
  TYPE_SKILL_GROUP: "Grupo de habilidades",
  TYPE_ESCO_OCCUPATION: "Ocupación ESCO",
  TYPE_LOCAL_OCCUPATION: "Ocupación local",
  TYPE_SKILL: "Habilidad",

  NO_HISTORY_AVAILABLE: "No hay historial disponible.",
};

const PT: ExplorerTranslations = {
  BACK_TO_DIRECTORY: "Todas as taxonomias",
  SELECT_TAXONOMY_VERSION: "Selecionar a versão da taxonomia",
  SELECT_LANGUAGE: "Selecionar o idioma de exibição",
  SWITCH_MODEL: "MUDAR DE MODELO",
  UNKNOWN_LOCALE: "Região desconhecida",
  NO_MODELS_AVAILABLE: "Nenhum modelo disponível",
  MODEL_NOT_FOUND: "Modelo não encontrado",
  CSV_DOWNLOAD_TOOLTIP: "Transferir a taxonomia em formato CSV",
  CSV_UNAVAILABLE_TOOLTIP: "Ainda não há uma exportação CSV disponível para esta taxonomia",

  TAB_OCCUPATIONS: "Ocupações",
  TAB_SKILLS: "Competências",
  SEARCH_OCCUPATIONS_PLACEHOLDER: "Pesquisar ocupações...",
  SEARCH_SKILLS_PLACEHOLDER: "Pesquisar competências...",
  NO_OCCUPATIONS_FOUND: "Nenhuma ocupação encontrada",
  NO_SKILLS_FOUND: "Nenhuma competência encontrada",
  SEEN_ECONOMY_GROUP: "Economia visível · ESCO",
  UNSEEN_ECONOMY_GROUP: "Economia invisível · ICATUS",

  SELECT_AN_ITEM: "Selecione um elemento para ver os seus detalhes",

  TAB_DEFINITION: "Definição",
  TAB_SKILLS_LINKED: "Competências associadas",
  TAB_OCCUPATIONS_LINKED: "Ocupações associadas",
  TAB_LINKS: "Associações",
  TAB_DETAILS: "Detalhes",
  TAB_HISTORY: "Histórico",

  BADGE_GROUP: "Grupo",
  BADGE_SEEN_ECONOMY: "Economia visível",
  BADGE_UNSEEN_ECONOMY: "Economia invisível",
  BADGE_SKILL: "Competência",
  SKILL_TYPE_SKILL_COMPETENCE: "Aptidão/competência",
  SKILL_TYPE_KNOWLEDGE: "Conhecimento",
  SKILL_TYPE_LANGUAGE: "Idioma",
  SKILL_TYPE_ATTITUDE: "Atitude",

  DESCRIPTION: "Descrição",
  NO_DEFINITION_AVAILABLE: "Nenhuma definição disponível",
  ALSO_KNOWN_AS: "Também conhecido como",
  CONTAINS: "Contém",
  EMPTY_GROUP: "Grupo vazio.",

  NO_LINKS_AVAILABLE: "Nenhuma associação disponível para este elemento.",
  ESSENTIAL_SKILLS: "Competências essenciais",
  OPTIONAL_SKILLS: "Competências opcionais",
  OCCUPATIONS_REQUIRING_THIS_SKILL: "Ocupações que exigem esta competência",

  DETAIL_TYPE: "Tipo",
  DETAIL_CODE: "Código",
  DETAIL_CHILDREN: "Filhos",
  DETAIL_ALTERNATIVE_LABELS: "Rótulos alternativos",
  TYPE_OCCUPATION_GROUP: "Grupo de ocupações",
  TYPE_SKILL_GROUP: "Grupo de competências",
  TYPE_ESCO_OCCUPATION: "Ocupação ESCO",
  TYPE_LOCAL_OCCUPATION: "Ocupação local",
  TYPE_SKILL: "Competência",

  NO_HISTORY_AVAILABLE: "Nenhum histórico disponível.",
};

// Keyed by language short code. Languages without an entry fall back to the default language.
const TRANSLATIONS: Record<string, ExplorerTranslations> = {
  en: EN,
  fr: FR,
  es: ES,
  pt: PT,
};

/**
 * Resolves the explorer's UI texts for a display language.
 * @param language the short code of the display language, e.g. "fr"
 * @returns the texts in that language, or in the default language when no translation exists for it
 */
export const getExplorerTranslations = (language: string): ExplorerTranslations =>
  TRANSLATIONS[language] ?? TRANSLATIONS[DEFAULT_LANGUAGE];

/** The explorer's UI texts in the currently selected display language. */
export const useExplorerTranslations = (): ExplorerTranslations => {
  const { language } = useLanguage();
  return getExplorerTranslations(language);
};
