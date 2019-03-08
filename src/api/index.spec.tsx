/* global fetchMock */
import configureStore from '../configureStore';
import {
  actions as apiActions,
  initialState as defaultApiState,
} from '../reducers/api';

import {
  HttpMethod,
  callApi,
  getCurrentUser,
  getDiff,
  getVersion,
  getVersionsList,
  isErrorResponse,
  logOutFromServer,
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
        `/api/${defaultVersion}/?lang=${defaultLang}`,
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

      await callApiWithDefaultApiState({ endpoint: '/', version });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(`/api/${version}/`),
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
      fetchMock.mockResponse(JSON.stringify(data));

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
});
