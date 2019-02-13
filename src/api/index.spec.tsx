/* global fetchMock */
import {
  actions as apiActions,
  initialState as defaultApiState,
} from '../reducers/api';
import configureStore from '../configureStore';

import { HttpMethod, callApi, getVersion, logOutFromServer } from '.';

describe(__filename, () => {
  const defaultQueryString = `?lang=${process.env.REACT_APP_DEFAULT_API_LANG}`;

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

    it('calls the API using the default language', async () => {
      await callApiWithDefaultApiState({ endpoint: '/foo/' });

      expect(fetch).toHaveBeenCalledWith(`/api/v4/foo/${defaultQueryString}`, {
        headers: {},
        method: 'GET',
      });
    });

    it('adds a trailing slash to the endpoint if there is none', async () => {
      await callApiWithDefaultApiState({ endpoint: '/foo' });

      expect(fetch).toHaveBeenCalledWith(
        `/api/v4/foo/${defaultQueryString}`,
        expect.any(Object),
      );
    });

    it('adds a leading slash to the endpoint if there is none', async () => {
      await callApiWithDefaultApiState({ endpoint: 'foo/' });

      expect(fetch).toHaveBeenCalledWith(
        `/api/v4/foo/${defaultQueryString}`,
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
        `/api/${version}/${defaultQueryString}`,
        expect.any(Object),
      );
    });

    it('accepts an API lang', async () => {
      const lang = 'en-CA';

      await callApiWithDefaultApiState({ endpoint: '/', lang });

      expect(fetch).toHaveBeenCalledWith(
        `/api/v4/?lang=${lang}`,
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
        new Error(`Unexpected status for GET /${defaultQueryString}: 400`),
      );
    });

    it('accepts query parameters', async () => {
      const query = { foo: '1', bar: 'abc' };

      await callApiWithDefaultApiState({ endpoint: '/url', query });

      expect(fetch).toHaveBeenCalledWith(
        `/api/v4/url/${defaultQueryString}&foo=1&bar=abc`,
        expect.any(Object),
      );
    });
  });

  describe('getVersion', () => {
    it('calls the API to retrieve version information', async () => {
      const addonId = 999;
      const versionId = 123;

      await getVersion({ apiState: defaultApiState, addonId, versionId });

      expect(fetch).toHaveBeenCalledWith(
        `/api/v4/reviewers/addon/${addonId}/versions/${versionId}/${defaultQueryString}`,
        {
          headers: {},
          method: HttpMethod.GET,
        },
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
        `/api/v4/reviewers/addon/${addonId}/versions/${versionId}/${defaultQueryString}&file=${path}`,
        {
          headers: {},
          method: HttpMethod.GET,
        },
      );
    });
  });

  describe('logOutFromServer', () => {
    it(`calls the API to delete the user's session`, async () => {
      await logOutFromServer(defaultApiState);

      expect(fetch).toHaveBeenCalledWith(
        `/api/v4/accounts/session/${defaultQueryString}`,
        {
          headers: {},
          method: HttpMethod.DELETE,
        },
      );
    });
  });
});
