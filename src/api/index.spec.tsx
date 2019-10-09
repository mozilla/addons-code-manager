/* eslint @typescript-eslint/camelcase: 0 */
/* global fetchMock */
import configureStore from '../configureStore';
import {
  actions as apiActions,
  initialState as defaultApiState,
} from '../reducers/api';
import {
  createFakeCommentsResponse,
  createFakeExternalComment,
  setMockFetchResponseJSON,
} from '../test-helpers';

import {
  HttpMethod,
  callApi,
  createOrUpdateComment,
  deleteComment,
  getApiHost,
  getComments,
  getCurrentUser,
  getDiff,
  getVersion,
  getVersionsList,
  isErrorResponse,
  logOutFromServer,
  makeApiURL,
  makeQueryString,
} from '.';

describe(__filename, () => {
  const defaultLang = process.env.REACT_APP_DEFAULT_API_LANG;
  const defaultVersion = process.env.REACT_APP_DEFAULT_API_VERSION;

  const getApiState = ({ authToken = '12345' } = {}) => {
    const store = configureStore();

    store.dispatch(apiActions.setAuthToken({ authToken }));
    const { api } = store.getState();

    return api;
  };

  describe('callApi', () => {
    const callApiWithDefaultApiState = (params = {}) => {
      return callApi({ apiState: defaultApiState, endpoint: '/', ...params });
    };

    it('calls the API with the expected defaults', async () => {
      await callApiWithDefaultApiState();

      expect(fetch).toHaveBeenCalledWith(
        makeApiURL({ path: `/?lang=${defaultLang}` }),
        {
          headers: {},
          method: 'GET',
        },
      );
    });

    it('calls the API using the default language', async () => {
      await callApiWithDefaultApiState();

      expect(fetch).toHaveBeenCalledWith(
        expect.urlWithTheseParams({
          lang: process.env.REACT_APP_DEFAULT_API_LANG,
        }),
        expect.any(Object),
      );
    });

    it('adds a trailing slash to the endpoint if there is none', async () => {
      await callApiWithDefaultApiState({ endpoint: '/foo' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching('/foo/'),
        expect.any(Object),
      );
    });

    it('adds a leading slash to the endpoint if there is none', async () => {
      await callApiWithDefaultApiState({ endpoint: 'foo/' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching('/foo/'),
        expect.any(Object),
      );
    });

    it('accepts an HTTP method', async () => {
      const method = HttpMethod.POST;

      await callApiWithDefaultApiState({ endpoint: '/foo/', method });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method,
        }),
      );
    });

    it('accepts an API version', async () => {
      const version = 'v123';
      const endpoint = '/';

      await callApiWithDefaultApiState({ endpoint, version });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(makeApiURL({ path: endpoint, version })),
        expect.any(Object),
      );
    });

    it('accepts an API lang', async () => {
      const lang = 'en-CA';

      await callApiWithDefaultApiState({ endpoint: '/', lang });

      expect(fetch).toHaveBeenCalledWith(
        expect.urlWithTheseParams({ lang }),
        expect.any(Object),
      );
    });

    it('does not send an Authorization header when apiState is the initial state', async () => {
      await callApiWithDefaultApiState({ endpoint: '/' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ headers: {} }),
      );
    });

    it('does not send an Authorization header when token is empty', async () => {
      const authToken = '';
      const apiState = getApiState({ authToken });

      await callApi({ apiState, endpoint: '/' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ headers: {} }),
      );
    });

    it('sends an Authorization header when apiState contains a token', async () => {
      const authToken = 'some-auth-token';
      const apiState = getApiState({ authToken });

      await callApi({ apiState, endpoint: '/' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
      );
    });

    it('returns an object containing an error when something went wrong', async () => {
      const error = new Error('some network error, maybe');
      fetchMock.mockReject(error);

      const response = await callApiWithDefaultApiState();

      expect(response).toEqual({ error });
    });

    it('returns an object containing the API response', async () => {
      const data = { some: 'data', count: 123 };
      setMockFetchResponseJSON(data);

      const response = await callApiWithDefaultApiState();

      expect(response).toEqual(data);
    });

    it('assumes a text response without content-type', async () => {
      const serverResponse = 'some kind of text response';
      fetchMock.mockResponse(serverResponse);

      const response = await callApiWithDefaultApiState();

      expect(response).toEqual(serverResponse);
    });

    it('handles text with an explicit content-type', async () => {
      const serverResponse = 'some kind of text response';
      fetchMock.mockResponse(serverResponse, {
        headers: { 'content-type': 'text/plain' },
      });

      const response = await callApiWithDefaultApiState();

      expect(response).toEqual(serverResponse);
    });

    it('handles JSON with an explicit content-type', async () => {
      const data = { thing: 'value' };
      setMockFetchResponseJSON(data, { contentType: 'application/json' });

      const response = await callApiWithDefaultApiState();

      expect(response).toEqual(data);
    });

    it('handles JSON with a content-type specifying the encoding', async () => {
      const data = { thing: 'value' };
      setMockFetchResponseJSON(data, {
        contentType: 'application/json; charset=utf-8',
      });

      const response = await callApiWithDefaultApiState();

      expect(response).toEqual(data);
    });

    it('treats a JSON content-type as case-insensitive', async () => {
      const data = { thing: 'value' };
      setMockFetchResponseJSON(data, { contentType: 'APPLICATION/JSON' });

      const response = await callApiWithDefaultApiState();

      expect(response).toEqual(data);
    });

    it('returns an object containing an error when the response is not OK', async () => {
      fetchMock.mockResponse('', { status: 400 });

      const response = await callApiWithDefaultApiState();

      expect(response).toHaveProperty(
        'error',
        new Error(`Unexpected status for GET /?lang=${defaultLang}: 400`),
      );
    });

    it('accepts query parameters', async () => {
      const query = { foo: '1', bar: 'abc' };

      await callApiWithDefaultApiState({ endpoint: '/url', query });

      expect(fetch).toHaveBeenCalledWith(
        expect.urlWithTheseParams(query),
        expect.any(Object),
      );
    });

    it('calls makeQueryString to construct the query string', async () => {
      const _makeQueryString = jest.fn();
      const query = { foo: '1', bar: 'abc' };

      await callApiWithDefaultApiState({
        _makeQueryString,
        endpoint: '/url',
        // Here, we disable the lang so that only `query` is passed to
        // `makeQueryString()`.
        lang: null,
        query,
      });

      expect(_makeQueryString).toHaveBeenCalledWith(query);
    });

    it('can include credentials', async () => {
      await callApiWithDefaultApiState({
        endpoint: '/url',
        includeCredentials: true,
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
        }),
      );
    });

    it('can omit credentials', async () => {
      await callApiWithDefaultApiState({
        endpoint: '/url',
        includeCredentials: false,
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: undefined,
        }),
      );
    });

    it('can send bodyData', async () => {
      const bodyData = { example: 'value' };
      await callApiWithDefaultApiState({ bodyData, endpoint: '/' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(bodyData),
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
    });
  });

  describe('isErrorResponse', () => {
    it('returns true if a response object is an error', () => {
      const response = { error: 'this is an error' };

      expect(isErrorResponse(response)).toEqual(true);
    });

    it('returns false if a response object is not an error', () => {
      const response = { id: 123 };

      expect(isErrorResponse(response)).toEqual(false);
    });
  });

  describe('getVersion', () => {
    it('calls the API to retrieve version information', async () => {
      const addonId = 999;
      const versionId = 123;

      await getVersion({ apiState: defaultApiState, addonId, versionId });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(
          `/api/${defaultVersion}/reviewers/addon/${addonId}/versions/${versionId}/`,
        ),
        expect.any(Object),
      );
    });

    it('calls the API to retrieve information for a specific file', async () => {
      const path = 'test.js';
      const addonId = 999;
      const versionId = 123;

      await getVersion({
        apiState: defaultApiState,
        addonId,
        path,
        versionId,
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(
          `/api/${defaultVersion}/reviewers/addon/${addonId}/versions/${versionId}/`,
        ),
        expect.any(Object),
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.urlWithTheseParams({ file: path }),
        expect.any(Object),
      );
    });
  });

  describe('getVersionsList', () => {
    it('calls the API to retrieve the list of versions for an add-on', async () => {
      const addonId = 999;

      await getVersionsList({ apiState: defaultApiState, addonId });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(
          `/api/${defaultVersion}/reviewers/addon/${addonId}/versions/`,
        ),
        expect.any(Object),
      );
    });
  });

  describe('logOutFromServer', () => {
    it(`calls the API to delete the user's session`, async () => {
      await logOutFromServer(defaultApiState);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(`/api/${defaultVersion}/accounts/session/`),
        {
          credentials: 'include',
          headers: {},
          method: HttpMethod.DELETE,
        },
      );
    });
  });

  describe('getCurrentUser', () => {
    it('calls the API to retrieve the current logged-in user profile', async () => {
      await getCurrentUser(defaultApiState);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(`/api/${defaultVersion}/accounts/profile/`),
        {
          headers: {},
          method: HttpMethod.GET,
        },
      );
    });
  });

  describe('getDiff', () => {
    it('calls the API to retrieve a diff of the default file between two versions', async () => {
      const addonId = 999;
      const baseVersionId = 1;
      const headVersionId = 2;

      await getDiff({
        apiState: defaultApiState,
        addonId,
        baseVersionId,
        headVersionId,
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(
          `/api/${defaultVersion}/reviewers/addon/${addonId}/versions/${baseVersionId}/compare_to/${headVersionId}/`,
        ),
        expect.any(Object),
      );
    });

    it('calls the API to retrieve a diff of a specific file between two versions', async () => {
      const addonId = 999;
      const baseVersionId = 1;
      const headVersionId = 2;
      const path = 'test.js';

      await getDiff({
        apiState: defaultApiState,
        addonId,
        baseVersionId,
        headVersionId,
        path,
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.urlWithTheseParams({ file: path }),
        expect.any(Object),
      );
    });
  });

  describe('getApiHost', () => {
    it('returns the API host configured with REACT_APP_API_HOST', () => {
      expect(getApiHost()).toEqual(process.env.REACT_APP_API_HOST);
    });

    it('returns an empty host when using an insecure proxy', () => {
      expect(getApiHost({ useInsecureProxy: true })).toEqual('');
    });

    it('returns an empty host when apiHost is null', () => {
      expect(getApiHost({ apiHost: null })).toEqual('');
    });

    it('returns the given apiHost when not using an insecure proxy', () => {
      const apiHost = 'http://example.org';

      expect(getApiHost({ apiHost, useInsecureProxy: false })).toEqual(apiHost);
    });
  });

  describe('makeApiURL', () => {
    it('constructs an API url for a given path', () => {
      const apiHost = 'https://example.org';
      const path = '/foo/';

      expect(makeApiURL({ apiHost, path })).toEqual(
        `${apiHost}/api/${defaultVersion}${path}`,
      );
    });

    it('can omit the version', () => {
      const path = '/foo/';

      expect(makeApiURL({ path, version: null })).toEqual(
        expect.stringMatching(`/api${path}`),
      );
    });

    it('can omit the prefix', () => {
      const path = '/foo/';
      const apiHost = 'https://example.org';

      expect(makeApiURL({ apiHost, path, prefix: null })).toEqual(
        `${apiHost}/${defaultVersion}${path}`,
      );
    });

    it('can omit both the prefix and version', () => {
      const path = '/foo/';
      const apiHost = 'https://example.org';

      expect(
        makeApiURL({ apiHost, path, prefix: null, version: null }),
      ).toEqual(`${apiHost}${path}`);
    });

    it('can override the default API version', () => {
      const path = '/foo/';
      const version = '123';

      expect(makeApiURL({ path, version })).toEqual(
        expect.stringMatching(`/api/${version}${path}`),
      );
    });

    it('can override the default prefix', () => {
      const path = '/foo/';
      const prefix = 'another-prefix';

      expect(makeApiURL({ path, prefix })).toEqual(
        expect.stringMatching(`/${prefix}/${defaultVersion}${path}`),
      );
    });

    it('makes sure the path starts with a slash', () => {
      const path = 'foo';

      expect(makeApiURL({ path })).toEqual(
        expect.stringMatching(`/api/${defaultVersion}/${path}`),
      );
    });

    it('constructs an API url for a given url', () => {
      const url = 'https://example.org/foo/';

      expect(makeApiURL({ url })).toEqual(url);
    });

    it('removes the apiHost of an url when apiHost is defined and useInsecureProxy is true', () => {
      const apiHost = 'https://example.org';
      const path = '/foo/';
      const url = `${apiHost}${path}`;

      expect(makeApiURL({ apiHost, url, useInsecureProxy: true })).toEqual(
        path,
      );
    });

    it('does not change the given url when apiHost is defined but useInsecureProxy is false', () => {
      const apiHost = 'https://example.org';
      const path = '/foo/';
      const url = `${apiHost}${path}`;

      expect(makeApiURL({ apiHost, url, useInsecureProxy: false })).toEqual(
        url,
      );
    });

    it('does not change the given url when useInsecureProxy is true but apiHost is not defined', () => {
      const apiHost = 'https://example.org';
      const path = '/foo/';
      const url = `${apiHost}${path}`;

      expect(
        makeApiURL({ apiHost: null, url, useInsecureProxy: true }),
      ).toEqual(url);
    });

    it('throws when both url and path are passed', () => {
      expect(() => {
        makeApiURL({ path: 'some-path', url: 'some-url' });
      }).toThrow(/Cannot receive both `path` and `url` parameters/);
    });

    it('throws when neither url nor path are passed', () => {
      expect(() => {
        makeApiURL({});
      }).toThrow(/Either `path` or `url` must be defined/);
    });
  });

  describe('makeQueryString', () => {
    it('transforms an object to a query string', () => {
      const query = makeQueryString({ user: 123, addon: 321 });
      expect(query).toEqual(
        expect.urlWithTheseParams({ user: '123', addon: '321' }),
      );
    });

    it('ignores undefined query string values', () => {
      const query = makeQueryString({ user: undefined, addon: 321 });
      expect(query).toEqual('?addon=321');
    });

    it('ignores null query string values', () => {
      const query = makeQueryString({ user: null, addon: 321 });
      expect(query).toEqual('?addon=321');
    });

    it('ignores empty string query string values', () => {
      const query = makeQueryString({ user: '', addon: 321 });
      expect(query).toEqual('?addon=321');
    });

    it('handles falsey integers', () => {
      const query = makeQueryString({ flag: 0 });
      expect(query).toEqual(expect.urlWithTheseParams({ flag: '0' }));
    });

    it('handles truthy integers', () => {
      const query = makeQueryString({ flag: 1 });
      expect(query).toEqual(expect.urlWithTheseParams({ flag: '1' }));
    });

    it('handles false values', () => {
      const query = makeQueryString({ flag: false });
      expect(query).toEqual(expect.urlWithTheseParams({ flag: 'false' }));
    });

    it('handles true values', () => {
      const query = makeQueryString({ flag: true });
      expect(query).toEqual(expect.urlWithTheseParams({ flag: 'true' }));
    });
  });

  describe('createOrUpdateComment', () => {
    const _createOrUpdateComment = (params = {}) => {
      return createOrUpdateComment({
        _callApi: jest.fn(),
        addonId: 123,
        apiState: defaultApiState,
        cannedResponseId: undefined,
        comment: 'Example comment',
        commentId: undefined,
        fileName: null,
        line: null,
        versionId: 321,
        ...params,
      });
    };

    it('can create a comment', async () => {
      const _callApi = jest.fn();
      const addonId = 999;
      const apiState = defaultApiState;
      const cannedResponseId = undefined;
      const comment = 'A comment about this code';
      const fileName = null;
      const line = null;
      const versionId = 123;

      await _createOrUpdateComment({
        _callApi,
        addonId,
        apiState,
        cannedResponseId,
        comment,
        fileName,
        line,
        versionId,
      });

      expect(_callApi).toHaveBeenCalledWith({
        apiState,
        bodyData: {
          canned_response: cannedResponseId,
          comment,
          filename: fileName,
          lineno: line,
        },
        endpoint: `reviewers/addon/${addonId}/versions/${versionId}/draft_comments`,
        method: HttpMethod.POST,
      });
    });

    it('can update a comment', async () => {
      const _callApi = jest.fn();
      const addonId = 999;
      const apiState = defaultApiState;
      const cannedResponseId = undefined;
      const comment = 'An updated comment about this code';
      const commentId = 456;
      const fileName = null;
      const line = null;
      const versionId = 123;

      await _createOrUpdateComment({
        _callApi,
        addonId,
        apiState,
        cannedResponseId,
        comment,
        commentId,
        fileName,
        line,
        versionId,
      });

      expect(_callApi).toHaveBeenCalledWith({
        apiState,
        bodyData: {
          canned_response: cannedResponseId,
          comment,
          filename: fileName,
          lineno: line,
        },
        endpoint: `reviewers/addon/${addonId}/versions/${versionId}/draft_comments/${commentId}`,
        method: HttpMethod.PATCH,
      });
    });

    it('returns the API response', async () => {
      const fakeComment = createFakeExternalComment();
      const _callApi = jest.fn().mockResolvedValue(fakeComment);

      const result = await _createOrUpdateComment({ _callApi });

      expect(result).toEqual(fakeComment);
    });

    it('requires either cannedResponseId or comment', async () => {
      await expect(
        _createOrUpdateComment({
          cannedResponseId: undefined,
          comment: undefined,
        }),
      ).rejects.toThrow(/cannedResponseId or comment must be specified/);
    });

    it('does not accept both cannedResponseId and comment', async () => {
      await expect(
        _createOrUpdateComment({
          cannedResponseId: 432,
          comment: 'Some comment',
        }),
      ).rejects.toThrow(
        /cannedResponseId and comment cannot both be specified/,
      );
    });

    it('does not accept both cannedResponseId and a blank comment', async () => {
      await expect(
        _createOrUpdateComment({
          cannedResponseId: 432,
          comment: '',
        }),
      ).rejects.toThrow(
        /cannedResponseId and comment cannot both be specified/,
      );
    });
  });

  describe('getComments', () => {
    it('can get comments', async () => {
      const addonId = 1;
      const apiState = defaultApiState;
      const versionId = 2;
      const results = [createFakeExternalComment()];
      const _callApi = jest
        .fn()
        .mockResolvedValue(createFakeCommentsResponse(results));

      const response = await getComments({
        _callApi,
        addonId,
        apiState,
        versionId,
      });

      expect(response).toMatchObject({ results });

      expect(_callApi).toHaveBeenCalledWith({
        apiState,
        endpoint: `reviewers/addon/${addonId}/versions/${versionId}/draft_comments`,
        method: HttpMethod.GET,
      });
    });
  });

  describe('deleteComment', () => {
    it('deletes a comment', async () => {
      const addonId = 1;
      const apiState = defaultApiState;
      const commentId = 2;
      const versionId = 3;

      const serverResponse = '';
      const _callApi = jest.fn().mockResolvedValue(serverResponse);

      const response = await deleteComment({
        _callApi,
        addonId,
        commentId,
        apiState,
        versionId,
      });

      expect(response).toEqual(serverResponse);

      expect(_callApi).toHaveBeenCalledWith({
        apiState,
        endpoint: `reviewers/addon/${addonId}/versions/${versionId}/draft_comments/${commentId}`,
        method: HttpMethod.DELETE,
      });
    });
  });
});
