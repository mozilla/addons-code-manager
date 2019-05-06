import urllib from 'url';

import log from 'loglevel';

import { ApiState } from '../reducers/api';
import { ExternalUser } from '../reducers/users';
import {
  ExternalVersionWithContent,
  ExternalVersionWithDiff,
  ExternalVersionsList,
} from '../reducers/versions';

type GetApiHostParams = {
  apiHost?: string | null;
  useInsecureProxy?: boolean;
};

export const getApiHost = ({
  apiHost = process.env.REACT_APP_API_HOST,
  useInsecureProxy = process.env.REACT_APP_USE_INSECURE_PROXY === 'true',
}: GetApiHostParams = {}) => {
  // When using the insecure proxy, there is no need for an API host.
  if (useInsecureProxy) {
    return '';
  }

  return apiHost || '';
};

type MakApiUrlParams = {
  apiHost?: string | null;
  path?: string;
  prefix?: string | null;
  url?: string;
  useInsecureProxy?: boolean;
  version?: string | null;
};

export const makeApiURL = ({
  apiHost = process.env.REACT_APP_API_HOST,
  path,
  prefix = 'api',
  url,
  useInsecureProxy = process.env.REACT_APP_USE_INSECURE_PROXY === 'true',
  version = process.env.REACT_APP_DEFAULT_API_VERSION,
}: MakApiUrlParams) => {
  if (path && url) {
    throw new Error('Cannot receive both `path` and `url` parameters.');
  }

  const parts = [];

  if (path) {
    parts.push(getApiHost({ apiHost, useInsecureProxy }));

    if (prefix) {
      parts.push(`/${prefix}`);
    }

    if (version) {
      parts.push(`/${version}`);
    }

    let adjustedPath = path;
    if (!adjustedPath.startsWith('/')) {
      adjustedPath = `/${adjustedPath}`;
    }
    parts.push(adjustedPath);
  } else if (url) {
    let adjustedUrl = url;
    if (apiHost && useInsecureProxy) {
      adjustedUrl = adjustedUrl.replace(apiHost, '');
    }
    parts.push(adjustedUrl);
  } else {
    throw new Error('Either `path` or `url` must be defined.');
  }

  return parts.join('');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const makeQueryString = (query: { [key: string]: any }) => {
  const resolvedQuery = { ...query };
  Object.keys(resolvedQuery).forEach((key) => {
    const value = resolvedQuery[key];
    if (value === undefined || value === null || value === '') {
      // Make sure we don't turn this into ?key= (empty string) because sending
      // an empty string to the API sometimes triggers bugs.
      delete resolvedQuery[key];
    }
  });
  return urllib.format({ query: resolvedQuery });
};

export enum HttpMethod {
  DELETE = 'DELETE',
  GET = 'GET',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
}

type CallApiParams = {
  _makeQueryString?: typeof makeQueryString;
  apiState: ApiState;
  endpoint: string;
  includeCredentials?: boolean;
  lang?: string;
  method?: HttpMethod;
  query?: { [key: string]: string };
  version?: string;
};

type ErrorResponseType = { error: Error };

type CallApiResponse<SuccessResponseType> =
  | SuccessResponseType
  | ErrorResponseType;

// This function below is a user-defined type guard that we use to check
// whether a callApi response object is successful or unsuccessful. We use
// `any` on purpose because we don't know the exact type for
// `SuccessResponseType`.
export const isErrorResponse = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arg: CallApiResponse<any>,
): arg is ErrorResponseType => {
  return arg.error !== undefined;
};

type Headers = {
  [name: string]: string;
};

// For the `extends {}` part, please see:
// https://github.com/Microsoft/TypeScript/issues/4922
export const callApi = async <SuccessResponseType extends {}>({
  _makeQueryString = makeQueryString,
  apiState,
  endpoint,
  includeCredentials = false,
  lang = process.env.REACT_APP_DEFAULT_API_LANG,
  method = HttpMethod.GET,
  query = {},
  version = process.env.REACT_APP_DEFAULT_API_VERSION,
}: CallApiParams): Promise<CallApiResponse<SuccessResponseType>> => {
  let path = endpoint;
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  if (!path.endsWith('/')) {
    path = `${path}/`;
  }

  const headers: Headers = {};
  if (apiState.authToken) {
    headers.Authorization = `Bearer ${apiState.authToken}`;
  }

  type QueryWithLang = {
    [key: string]: string;
  };

  // Add the lang parameter to the query string.
  const queryWithLang: QueryWithLang = lang ? { ...query, lang } : query;

  path = `${path}${_makeQueryString(queryWithLang)}`;

  try {
    const response = await fetch(makeApiURL({ path, version }), {
      credentials: includeCredentials ? 'include' : undefined,
      headers,
      method,
    });

    if (!response.ok) {
      throw new Error(
        `Unexpected status for ${method} ${path}: ${response.status}`,
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

type GetVersionParams = {
  addonId: number;
  apiState: ApiState;
  path?: string;
  versionId: number;
};

export const getVersion = async ({
  apiState,
  path,
  addonId,
  versionId,
}: GetVersionParams) => {
  return callApi<ExternalVersionWithContent>({
    apiState,
    endpoint: `reviewers/addon/${addonId}/versions/${versionId}`,
    query: path ? { file: path } : undefined,
  });
};

type GetVersionsListParams = {
  addonId: number;
  apiState: ApiState;
};

export const getVersionsList = async ({
  apiState,
  addonId,
}: GetVersionsListParams) => {
  return callApi<ExternalVersionsList>({
    apiState,
    endpoint: `reviewers/addon/${addonId}/versions/`,
  });
};

export const logOutFromServer = async (apiState: ApiState) => {
  return callApi<{}>({
    apiState,
    // We need to send the credentials (cookies) because the API will return
    // new `Set-Cookie` headers to clear the cookies in the client. Without
    // this, logging out would not be possible.
    includeCredentials: true,
    endpoint: 'accounts/session',
    method: HttpMethod.DELETE,
  });
};

export const getCurrentUser = async (apiState: ApiState) => {
  return callApi<ExternalUser>({
    apiState,
    endpoint: '/accounts/profile/',
  });
};

type GetDiffParams = {
  addonId: number;
  apiState: ApiState;
  baseVersionId: number;
  headVersionId: number;
  path?: string;
};

export const getDiff = async ({
  addonId,
  apiState,
  baseVersionId,
  headVersionId,
  path,
}: GetDiffParams) => {
  return callApi<ExternalVersionWithDiff>({
    apiState,
    endpoint: `reviewers/addon/${addonId}/versions/${baseVersionId}/compare_to/${headVersionId}`,
    query: path ? { file: path } : undefined,
  });
};
