import url from 'url';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
  namespace jest {
    interface Matchers<R, T> {
      urlWithTheseParams(params: {
        [key: string]: string | undefined;
      }): CustomMatcherResult;
    }

    interface Expect {
      urlWithTheseParams(params: {
        [key: string]: string | undefined;
      }): CustomMatcherResult;
    }
  }
}

expect.extend({
  /*
   * A jest matcher to check if the URL contains the declared params.
   *
   * Example:
   *
   * expect(fetch).toHaveBeenCalledWith(
   *   expect.urlWithTheseParams({
   *     page: 1,
   *   }),
   * )
   */
  urlWithTheseParams(urlString: string, params: { [key: string]: string }) {
    const { query } = url.parse(urlString, true);

    for (const param in params) {
      if (
        query[param] === undefined ||
        query[param] !== params[param].toString()
      ) {
        return {
          message: () =>
            `expected ${urlString} to contain params ${JSON.stringify(params)}`,
          pass: false,
        };
      }
    }
    return {
      message: () =>
        `expected ${urlString} to not contain params ${JSON.stringify(params)}`,
      pass: true,
    };
  },
});
