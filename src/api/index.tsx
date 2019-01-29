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

type Headers = {
  [name: string]: string;
};

export const callApi = async ({
  apiState,
  endpoint,
  method = HttpMethod.GET,
  version = 'v4',
}: CallApiParams): Promise<object | { error: Error }> => {
  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`;
  }
  if (!endpoint.endsWith('/')) {
    endpoint = `${endpoint}/`;
  }

  const headers = {} as Headers;
  if (apiState.authToken) {
    headers['Authorization'] = `Bearer ${apiState.authToken}`;
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
    console.error(error);

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
