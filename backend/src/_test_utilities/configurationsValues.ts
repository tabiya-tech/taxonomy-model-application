export function stdConfigurationValuesTest<IConfiguration>(
  setConfiguration: (config: IConfiguration) => void,
  getMockConfig: () => IConfiguration,
  getFunctionName: string,
  getFunction: () => string,
  configKey: keyof IConfiguration
) {
  return describe(`Test ${getFunctionName}()`, () => {
    test(`${getFunctionName}() should return the set value`, () => {
      // GIVEN a configuration is set
      const givenConfig = getMockConfig();
      setConfiguration(givenConfig);

      // WHEN calling the getFunction to be tested
      const actualValue = getFunction();

      // THEN expect the getFunction to return the given config value for the tested config key
      expect(actualValue).toEqual(givenConfig[configKey]);
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])(`${getFunctionName}() should return '' if the set value %s`, (description, givenValue) => {
      // GIVEN a configuration value of the tested config key is set to the given value
      const config = {
        [configKey]: givenValue,
      };
      // @ts-ignore
      setConfiguration(config);

      // WHEN calling the getFunction to be tested
      const actualValue = getFunction();

      // THEN expect the function to return an empty string
      expect(actualValue).toEqual("");
    });

    test.each([
      ["is undefined", undefined],
      ["is null", null],
    ])(`${getFunctionName}() should return '' if configuration %s`, (description, givenValue) => {
      // GIVEN a configuration is set to the given value
      // @ts-ignore
      setConfiguration(givenValue);

      // WHEN calling the getFunction to be tested
      const actual = getFunction();

      // THEN expect the function to return an empty string
      expect(actual).toEqual("");
    });
  });
}
