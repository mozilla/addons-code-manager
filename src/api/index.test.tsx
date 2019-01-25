import { HttpMethod, callApi } from '.';
import { initialState as apiState } from '../reducers/api';

describe(__filename, () => {
  describe('callApi', () => {
    it('calls the API', async () => {
      fetchMock.mockResponse(JSON.stringify({}));

      await callApi({ apiState, endpoint: '/foo/' });

      expect(fetch).toHaveBeenCalledWith(`/api/v4/foo/`, {
        method: 'GET',
        headers: {},
      });
    });

    it('adds a trailing slash to the endpoint if there is none', async () => {
      fetchMock.mockResponse(JSON.stringify({}));

      await callApi({ apiState, endpoint: '/foo' });

      expect(fetchMock.mock.calls[0][0]).toEqual(`/api/v4/foo/`);
    });

    it('adds a leading slash to the endpoint if there is none', async () => {
      fetchMock.mockResponse(JSON.stringify({}));

      await callApi({ apiState, endpoint: 'foo/' });

      expect(fetchMock.mock.calls[0][0]).toEqual(`/api/v4/foo/`);
    });

    it('accepts an HTTP method', async () => {
      fetchMock.mockResponse(JSON.stringify({}));

      const method = HttpMethod.POST;
      await callApi({ apiState, endpoint: '/foo/', method });

      expect(fetchMock.mock.calls[0][1]).toMatchObject({
        method,
      });
    });
  });
});
