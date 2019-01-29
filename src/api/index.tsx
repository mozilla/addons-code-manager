/* global fetch */
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
  if (!endpoint.startsWith('/')) {
    // eslint-disable-next-line no-param-reassign
    endpoint = `/${endpoint}`;
  }
  if (!endpoint.endsWith('/')) {
    // eslint-disable-next-line no-param-reassign
    endpoint = `${endpoint}/`;
  }

  const headers: Headers = {};
  if (apiState.authToken) {
    headers.Authorization = `Bearer ${apiState.authToken}`;
  }

  try {
    const response = await fetch(`/api/${version}${endpoint}`, {
      method,
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Unexpected status for ${method} ${endpoint}: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    // eslint-disable-next-line amo/only-log-strings, no-console
    console.error(error);

    return {
      error,
    };
  }
};

export const logOutFromServer = async (
  apiState: ApiState,
): Promise<CallApiResponse> => {
  return callApi({
    apiState,
    endpoint: 'accounts/session',
    method: HttpMethod.DELETE,
  });
};
