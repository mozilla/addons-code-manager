import log from 'loglevel';

import { ApiState } from '../reducers/api';
import { ExternalUser } from '../reducers/users';
import {
  ExternalVersionWithContent,
  ExternalVersionWithDiff,
  ExternalVersionsList,
} from '../reducers/versions';

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
  query?: { [key: string]: string };
  lang?: string;
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
  apiState,
  endpoint,
  method = HttpMethod.GET,
  version = process.env.REACT_APP_DEFAULT_API_VERSION,
  query = {},
  lang = process.env.REACT_APP_DEFAULT_API_LANG,
}: CallApiParams): Promise<CallApiResponse<SuccessResponseType>> => {
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

  type QueryWithLang = {
    [key: string]: string;
  };

  // Add the lang parameter to the query string.
  const queryWithLang: QueryWithLang = lang ? { ...query, lang } : query;

  const queryString = Object.keys(queryWithLang)
    .map((k) => `${k}=${queryWithLang[k]}`)
    .join('&');

  adjustedEndpoint = `${adjustedEndpoint}?${queryString}`;

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
