import "_test_utilities/consoleMock"

import { getStdHeadersValidator } from './stdHeadersValidator';
import {getMockId} from "_test_utilities/mockMongoId";

describe('getStdHeadersValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('call getStdHeadersValidator should return a function', () => {
    // GIVEN a valid modelId
    const modelId = getMockId(2);
    // AND headers
    const expectedHeaders = ['header1', 'header2'];

    // WHEN getStdHeadersValidator is called with valid params
    const headersValidator = getStdHeadersValidator(modelId, expectedHeaders);

    // THEN a validator should be function
    expect(typeof headersValidator).toBe('function');
  });

  test('should return true when actual headers include all expected headers', async () => {
    // GIVEN a valid modelId
    const modelId = getMockId(2);
    // AND expect expected headers present

    const expectedHeaders = ['header1', 'header2'];
    // WHEN getStdHeadersValidator is called with valid params
    const headersValidator = getStdHeadersValidator(modelId, expectedHeaders);
    // AND received actual headers

    const actualHeaders = ['header1', 'header2', 'header3'];
    //  THEN headersValidator should validate correctly
    const result = await headersValidator(actualHeaders);
    expect(result).toBe(true);
  });

  test('should return false when actual headers do not include all expected headers', async () => {
    // GIVEN a valid modelId
    const modelId = getMockId(2);
    // AND expect expected headers present
    const expectedHeaders = ['header1', 'header2'];

    // WHEN getStdHeadersValidator is called with valid params
    const headersValidator = getStdHeadersValidator(modelId, expectedHeaders);
    // AND received actual headers
    const actualHeaders = ['header1'];

    //  THEN headersValidator should validate correctly
    const result = await headersValidator(actualHeaders);
    expect(result).toBe(false);
  });

  test('should log a warning for each missing expected header', async () => {
    const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation();

    // GIVEN a valid modelId
    const modelId = getMockId(2);
    // AND expect expected headers present
    const expectedHeaders = ['header1', 'header2'];

    // WHEN getStdHeadersValidator is called with valid params
    const headersValidator = getStdHeadersValidator(modelId, expectedHeaders);
    // AND received actual headers
    const actualHeaders = ['header1'];
    // AND  validate which fails is called

    await headersValidator(actualHeaders);
    //  THEN headersValidator  should call warn with correct header
    expect(consoleWarnMock).toHaveBeenCalledTimes(1);
    expect(consoleWarnMock).toHaveBeenCalledWith(
      `When importing data for model ${modelId}, expected to include header ${expectedHeaders[1]}`
    );
  });
});
