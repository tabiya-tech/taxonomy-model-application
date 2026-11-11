import ModelInfoTypes from "../../types";
import Locale from "../../../locale";

namespace PATCHModelTypes {
  export namespace Request {
    /**
     * The payload of a model patch. Every field is optional on its own, but a payload must carry at least one of
     * them, see ./schema.request.ts. Fields not supplied are left unchanged (true partial update).
     *
     * Editable metadata fields (name, description, locale, license, UUIDHistory) cannot be changed
     * on a released model — the endpoint rejects those with 409. availableLanguages is exempt from
     * that restriction: languages may still be added after release.
     *
     * When released is supplied together with other fields, all changes are applied atomically.
     */
    export interface Payload {
      /** Releases the model. Only true is accepted; false is rejected. Once released, the model is immutable for metadata. */
      released?: true;
      /** Release notes to record for this release. Only valid when released: true is also supplied. */
      releaseNotes?: string;
      /** Full list of languages the model carries data in. Existing languages may not be removed. */
      availableLanguages?: string[];
      /** Display name of the model. Must be a non-empty string. */
      name?: string;
      /** Human-readable description of the model. May be empty. */
      description?: string;
      /** Locale (country / market) the model describes. */
      locale?: Locale.Types.Payload;
      /** License text or identifier for the model. May be empty. */
      license?: string;
      /**
       * Full UUID history of the model. Must include the model's current UUID.
       * Minimum 1 entry, maximum 10,000 entries, all valid UUIDv4, no duplicates.
       */
      UUIDHistory?: string[];
    }
  }
  export namespace Response {
    export type Payload = ModelInfoTypes.Response.IModelInfo;
  }
}

export default PATCHModelTypes;
