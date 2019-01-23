type CallApiParams = {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  credentials?: boolean;
  version?: string;
};

type Headers = {
  [name: string]: string;
};

export const callApi = async ({
  endpoint,
  method = 'GET',
  credentials = false,
  version = 'v4',
}: CallApiParams) => {
  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`;
  }
  if (!endpoint.endsWith('/')) {
    endpoint = `${endpoint}/`;
  }

  const headers = {} as Headers;
  const rootElement = document.getElementById('root');
  const authToken = rootElement ? rootElement.dataset.authToken : null;

  if (authToken && authToken !== process.env.REACT_APP_AUTH_TOKEN_PLACEHOLDER) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`/api/${version}${endpoint}`, {
      method,
      headers,
      credentials: credentials ? 'include' : undefined,
    });

    return await response.json();
  } catch (error) {
    return {
      error,
    };
  }
};

export const logOutFromServer = async () => {
  return callApi({
    credentials: true,
    endpoint: 'accounts/session',
    method: 'DELETE',
  });
};
