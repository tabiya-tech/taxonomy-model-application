import LocaleAPISpecs from "api-specifications/locale";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";

export function getOneFakeLocale(): LocaleAPISpecs.Types.Payload {
  return {
    UUID: uuidv4(),
    name: faker.location.country(),
    shortCode: faker.location.countryCode("alpha-3"),
  };
}

export function getArrayOfFakeLocales(count: number): LocaleAPISpecs.Types.Payload[] {
  const locales: LocaleAPISpecs.Types.Payload[] = [];
  for (let i = 0; i < count; i++) {
    locales.push(getOneFakeLocale());
  }
  return locales;
}
