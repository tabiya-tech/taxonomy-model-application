import { APIGatewayProxyEventHeaders } from "aws-lambda";
import LanguageAPISpecs from "api-specifications/language";
import { getFallbackLanguageConfig } from "./fallbackLanguage";

/**
 * Resolves the language a response is served in.
 *
 * The client asks for a language with the Accept-Language header, the model offers the languages it has been imported
 * with. The resolution is the intersection of the two, in the order of preference of the client, and it always ends up
 * with a language, the fall back language, when the client and the model have nothing in common.
 */

/** The language range that means "any language", see RFC 9110 */
const ANY_LANGUAGE = "*";

/** The quality of a language range that does not carry a q parameter, see RFC 9110 */
const DEFAULT_QUALITY = 1;

/** The name of the Accept-Language header, API Gateway lower cases the header names, but not every caller does */
const ACCEPT_LANGUAGE_HEADER_NAME = "accept-language";

/** A single language range of the Accept-Language header, e.g. "fr-CH;q=0.9" */
type AcceptLanguageRange = {
  /** The language tag of the range, lower cased, e.g. "fr-ch" */
  tag: string;
  /** The quality of the range, a number in (0, 1] */
  quality: number;
  /** The position of the range in the header, it breaks the ties of ranges of equal quality */
  position: number;
};

/**
 * Reads the Accept-Language header out of the headers of a request.
 *
 * API Gateway lower cases the header names, a caller that builds the event by hand might not, so the lookup is case
 * insensitive.
 *
 * @param headers the headers of the request
 * @returns the raw value of the Accept-Language header, or undefined when the request does not carry one
 */
export function getAcceptLanguageHeader(headers: APIGatewayProxyEventHeaders | undefined | null): string | undefined {
  if (headers === undefined || headers === null) {
    return undefined;
  }
  const headerName = Object.keys(headers).find((name) => name.toLowerCase() === ACCEPT_LANGUAGE_HEADER_NAME);
  if (headerName === undefined) {
    return undefined;
  }
  const headerValue = headers[headerName];
  return typeof headerValue === "string" ? headerValue : undefined;
}

/**
 * Parses the quality of a language range.
 * @param parameters the parameters of the range, e.g. ["q=0.9"]
 * @returns the quality of the range, or undefined when the range carries a malformed quality
 */
function parseQuality(parameters: string[]): number | undefined {
  const qualityParameter = parameters
    .map((parameter) => parameter.trim())
    .find((parameter) => parameter.toLowerCase().startsWith("q="));
  if (qualityParameter === undefined) {
    return DEFAULT_QUALITY;
  }
  const quality = Number(qualityParameter.slice("q=".length).trim());
  if (!Number.isFinite(quality) || quality < 0 || quality > 1) {
    return undefined;
  }
  return quality;
}

/**
 * Parses the Accept-Language header into the language ranges it carries, most preferred first.
 *
 * A malformed range is dropped instead of failing the whole header, a client that sends garbage is served the fall
 * back language, it is not served an error.
 *
 * @param acceptLanguageHeader the raw value of the Accept-Language header
 * @returns the language ranges the client accepts, ordered by quality descending
 */
function parseAcceptLanguageHeader(acceptLanguageHeader: string): AcceptLanguageRange[] {
  return acceptLanguageHeader
    .split(",")
    .map((rawRange, position): AcceptLanguageRange | undefined => {
      const [rawTag, ...parameters] = rawRange.split(";");
      const tag = rawTag.trim().toLowerCase();
      if (tag.length === 0) {
        return undefined;
      }
      const quality = parseQuality(parameters);
      // a range that is not acceptable (q=0) or that carries a malformed quality is not a preference of the client
      if (quality === undefined || quality === 0) {
        return undefined;
      }
      return { tag, quality, position };
    })
    .filter((range): range is AcceptLanguageRange => range !== undefined)
    .sort((a, b) => b.quality - a.quality || a.position - b.position);
}

/**
 * Maps the languages a model has to the languages of the registry.
 *
 * A language the model has that the registry does not know about cannot be served, it is dropped.
 *
 * @param availableLanguages the short codes of the languages the model has
 * @returns the configurations of the languages that can be served, in the order of the model
 */
function getCandidateLanguages(
  availableLanguages: readonly string[] | undefined | null
): LanguageAPISpecs.Types.ILanguageConfig[] {
  if (!Array.isArray(availableLanguages)) {
    return [];
  }
  const candidates: LanguageAPISpecs.Types.ILanguageConfig[] = [];
  availableLanguages.forEach((availableLanguage) => {
    if (typeof availableLanguage !== "string") {
      return;
    }
    const language = LanguageAPISpecs.Helpers.getLanguageByShortCode(availableLanguage.trim().toLowerCase());
    if (language !== undefined && !candidates.includes(language)) {
      candidates.push(language);
    }
  });
  return candidates;
}

/**
 * Finds the language a language range asks for.
 *
 * The match is exact on the short code first, e.g. "fr" matches "fr", and on the primary subtag second, e.g. "fr-CH"
 * matches "fr". The registry has no regional languages, so the primary subtag is as deep as the match goes.
 *
 * @param range the language range of the client
 * @param candidates the languages that can be served
 * @returns the language that is asked for, or undefined when no language matches the range
 */
function matchRange(
  range: AcceptLanguageRange,
  candidates: LanguageAPISpecs.Types.ILanguageConfig[]
): LanguageAPISpecs.Types.ILanguageConfig | undefined {
  const [primarySubTag] = range.tag.split("-");
  return (
    candidates.find((candidate) => candidate.shortCode === range.tag) ??
    candidates.find((candidate) => candidate.shortCode === primarySubTag)
  );
}

/**
 * Resolves the language a response is served in.
 *
 * The short code of the resolved language is what the client asked for, its dbKeyName is what a translated value is
 * keyed by, see resolveTranslated. Use this function when both are needed, resolveLanguage when the short code is
 * enough.
 *
 * @param acceptLanguageHeader the raw value of the Accept-Language header of the request, it may be absent
 * @param availableLanguages the short codes of the languages the model has
 * @returns the configuration of the language to serve, the fall back language when the client and the model agree on none
 */
export function resolveLanguageConfig(
  acceptLanguageHeader: string | undefined | null,
  availableLanguages: readonly string[] | undefined | null
): LanguageAPISpecs.Types.ILanguageConfig {
  const fallbackLanguage = getFallbackLanguageConfig();
  const candidates = getCandidateLanguages(availableLanguages);

  // the model has no language that the platform knows about, there is nothing to choose from
  if (candidates.length === 0) {
    return fallbackLanguage;
  }

  // the client does not ask for a language, it is served the fall back language
  if (typeof acceptLanguageHeader !== "string") {
    return fallbackLanguage;
  }

  const ranges = parseAcceptLanguageHeader(acceptLanguageHeader);
  for (const range of ranges) {
    // the client accepts any language, it is served the fall back language when the model has it, the first language
    // the model has otherwise
    if (range.tag === ANY_LANGUAGE) {
      return candidates.includes(fallbackLanguage) ? fallbackLanguage : candidates[0];
    }
    const matchedLanguage = matchRange(range, candidates);
    if (matchedLanguage !== undefined) {
      return matchedLanguage;
    }
  }

  // the client asks for languages that the model does not have
  return fallbackLanguage;
}

/**
 * Resolves the short code of the language a response is served in.
 *
 * @param acceptLanguageHeader the raw value of the Accept-Language header of the request, it may be absent
 * @param availableLanguages the short codes of the languages the model has
 * @returns the short code of the language to serve, the fall back language when the client and the model agree on none
 */
export function resolveLanguage(
  acceptLanguageHeader: string | undefined | null,
  availableLanguages: readonly string[] | undefined | null
): string {
  return resolveLanguageConfig(acceptLanguageHeader, availableLanguages).shortCode;
}
