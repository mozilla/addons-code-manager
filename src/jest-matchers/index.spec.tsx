const baseUrl = 'http://example.com';
const param1 = 'param1';
const param2 = 'param2';
const testParams = { param1, param2 };

describe('.urlWithTheseParams', () => {
  test('passes when URL includes all params', () => {
    expect(`${baseUrl}?param1=${param1}&param2=${param2}`).urlWithTheseParams(
      testParams,
    );
  });

  test('passes regardless of order of params', () => {
    expect(`${baseUrl}?param2=${param2}&param1=${param1}`).urlWithTheseParams(
      testParams,
    );
  });

  test('provides a descriptive message when it fails', () => {
    const testUrl = `${baseUrl}?param1=${param1}`;
    expect(() => expect(testUrl).urlWithTheseParams(testParams)).toThrow(
      `expected ${testUrl} to contain params ${JSON.stringify(testParams)}`,
    );
  });

  test('fails when URL includes no params', () => {
    expect(() => expect(baseUrl).urlWithTheseParams(testParams)).toThrow(
      'expected',
    );
  });

  test('fails when URL includes only some params', () => {
    expect(() =>
      expect(`${baseUrl}?param1=${param1}`).urlWithTheseParams(testParams),
    ).toThrow('expected');
  });
});

describe('.not.urlWithTheseParams', () => {
  test('passes when URL includes no params', () => {
    expect(baseUrl).not.urlWithTheseParams(testParams);
  });

  test('passes when URL includes only some params', () => {
    expect(`${baseUrl}?param1=${param1}`).not.urlWithTheseParams(testParams);
  });

  test('provides a descriptive message when it fails', () => {
    const testUrl = `${baseUrl}?param1=${param1}&param2=${param2}`;
    expect(() => expect(testUrl).not.urlWithTheseParams(testParams)).toThrow(
      `expected ${testUrl} to not contain params ${JSON.stringify(testParams)}`,
    );
  });

  test('fails when URL includes all params', () => {
    expect(() =>
      expect(
        `${baseUrl}?param1=${param1}&param2=${param2}`,
      ).not.urlWithTheseParams(testParams),
    ).toThrow('expected');
  });

  test('fails regardless of order of params', () => {
    expect(() =>
      expect(
        `${baseUrl}?param2=${param2}&param1=${param1}`,
      ).not.urlWithTheseParams(testParams),
    ).toThrow('expected');
  });
});
