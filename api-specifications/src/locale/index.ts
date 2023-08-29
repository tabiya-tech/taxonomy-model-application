import LocaleResponseSchema from "./locale.schema";
import LocaleTypes from "./locale.types";

/**
 * This module should be imported in the following way

 import Locale from "api-specifications/locale";
 */

export namespace Locale {
    export type Payload = LocaleTypes.Payload;
    export const Schema = LocaleResponseSchema;
}
export default Locale;