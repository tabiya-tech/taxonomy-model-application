interface ILocale {
  UUID: string;
  shortCode: string;
  name: string;
}

namespace LocaleTypes {
      export type Payload = ILocale
}

export default LocaleTypes;