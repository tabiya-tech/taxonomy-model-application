import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { LocaleSchema } from "src/api-types";

export function getOneFakeLocale(): LocaleSchema {
  return {
    UUID: uuidv4(),
    name: faker.location.country(),
    shortCode: faker.location.countryCode("alpha-3"),
  };
}

export function getArrayOfFakeLocales(count: number): LocaleSchema[] {
  const locales: LocaleSchema[] = [];
  for (let i = 0; i < count; i++) {
    locales.push(getOneFakeLocale());
  }
  return locales;
}
