import log from 'loglevel';

import { ApiState } from '../reducers/api';

export enum HttpMethod {
  DELETE = 'DELETE',
  GET = 'GET',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
}

type CallApiParams = {
  endpoint: string;
  method?: HttpMethod;
  version?: string;
  apiState: ApiState;
};

type CallApiResponse = object | { error: Error };

type Headers = {
  [name: string]: string;
};

export const callApi = async ({
  apiState,
  endpoint,
  method = HttpMethod.GET,
  version = 'v4',
}: CallApiParams): Promise<CallApiResponse> => {
  let adjustedEndpoint = endpoint;
  if (!adjustedEndpoint.startsWith('/')) {
    adjustedEndpoint = `/${adjustedEndpoint}`;
  }
  if (!adjustedEndpoint.endsWith('/')) {
    adjustedEndpoint = `${adjustedEndpoint}/`;
  }

  const headers: Headers = {};
  if (apiState.authToken) {
    headers.Authorization = `Bearer ${apiState.authToken}`;
  }

  try {
    const response = await fetch(`/api/${version}${adjustedEndpoint}`, {
      method,
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Unexpected status for ${method} ${adjustedEndpoint}: ${
          response.status
        }`,
      );
    }

    return await response.json();
  } catch (error) {
    log.debug('Error caught in callApi():', error);

    return {
      error,
    };
  }
};

export const logOutFromServer = async (apiState: ApiState) => {
  return callApi({
    apiState,
    endpoint: 'accounts/session',
    method: HttpMethod.DELETE,
  });
};
