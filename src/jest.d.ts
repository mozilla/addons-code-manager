declare namespace jest {
  interface Matchers<R> {
    urlWithTheseParams(params: { [key: string]: string }): CustomMatcherResult;
  }
}
