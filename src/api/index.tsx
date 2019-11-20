/* eslint-disable @typescript-eslint/camelcase */
import urllib from 'url';

import log from 'loglevel';

import { ApiState } from '../reducers/api';
import { ExternalComment } from '../reducers/comments';
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

export const makeQueryString = (query: {
  [key: string]: string | number | null | undefined | boolean;
}) => {
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

type CallApiParams<BodyDataType extends undefined | {}> = {
  _makeQueryString?: typeof makeQueryString;
  apiState: ApiState;
  bodyData?: BodyDataType;
  endpoint?: string | undefined;
  endpointUrl?: string | undefined;
  includeCredentials?: boolean;
  lang?: string;
  method?: HttpMethod;
  query?: { [key: string]: string };
  version?: string;
};

export type ErrorResponseType = { error: Error };

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

type ResponseOnly<SuccessfulResponse> = {
  requestData: undefined;
  successfulResponse: SuccessfulResponse;
};

type EmptyRequestAndResponse = {
  requestData: undefined;
  successfulResponse: '';
};

export const callApi = async <
  T extends {
    requestData: undefined | {};
    successfulResponse: {};
  }
>({
  _makeQueryString = makeQueryString,
  apiState,
  bodyData,
  endpoint,
  endpointUrl,
  includeCredentials = false,
  lang = process.env.REACT_APP_DEFAULT_API_LANG,
  method = HttpMethod.GET,
  query = {},
  version = process.env.REACT_APP_DEFAULT_API_VERSION,
}: CallApiParams<T['requestData']>): Promise<CallApiResponse<
  T['successfulResponse']
>> => {
  const headers: Headers = {};
  if (apiState.authToken) {
    headers.Authorization = `Bearer ${apiState.authToken}`;
  }

  let body;
  if (bodyData) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(bodyData);
  }

  if (endpointUrl && endpoint) {
    throw new Error('endpoint and endpointUrl cannot both be defined at once');
  }

  let path;
  let url;

  if (endpointUrl) {
    url = endpointUrl;
  } else if (endpoint) {
    path = endpoint;
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    if (!path.endsWith('/')) {
      path = `${path}/`;
    }

    // Add the lang parameter to the query string.
    const queryWithLang: Record<string, string> = lang
      ? { ...query, lang }
      : query;

    path = `${path}${_makeQueryString(queryWithLang)}`;
  } else {
    throw new Error('Either endpoint or endpointUrl must be defined');
  }

  try {
    const response = await fetch(makeApiURL({ path, url, version }), {
      body,
      credentials: includeCredentials ? 'include' : undefined,
      headers,
      method,
    });

    if (!response.ok) {
      throw new Error(
        `Unexpected status for ${method} ${path}: ${response.status}`,
      );
    }

    const contentType = (
      response.headers.get('content-type') || ''
    ).toLowerCase();

    return await (contentType.startsWith('application/json')
      ? response.json()
      : // The API might return a text response, like 204s.
        response.text());
  } catch (error) {
    log.debug('Error caught in callApi():', error);

    return { error };
  }
};

export type PaginatedResponse<ResultsType> = {
  count: number;
  next: string | null;
  page_count: number;
  page_size: number;
  previous: string | null;
  results: ResultsType;
};

export type FetchAllPagesReturnType<ResultsType> =
  | PaginatedResponse<ResultsType[]>
  | ErrorResponseType;

export type FetchAllPagesOptions = {
  maxAllowedPages?: number;
};

/*
 * This repeatedly fetches the URL at response.next until there are no
 * pages left then returns a PaginatedResponse with all accumulated
 * results.
 *
 * Only use this if you know for sure the page size will be small!
 */
export const fetchAllPages = async <ResultsType,>(
  getNextResponse: (
    nextUrl: PaginatedResponse<ResultsType[]>['next'],
  ) => Promise<FetchAllPagesReturnType<ResultsType>>,
  { maxAllowedPages = 100 } = {},
): Promise<FetchAllPagesReturnType<ResultsType>> => {
  let results: ResultsType[] = [];
  let nextUrl = null;

  for (let page = 1; page <= maxAllowedPages; page++) {
    const response: FetchAllPagesReturnType<ResultsType> = await getNextResponse(
      nextUrl,
    );

    if (isErrorResponse(response)) {
      return response;
    }

    results = results.concat(response.results);

    if (response.next) {
      nextUrl = response.next;
    } else {
      return {
        count: results.length,
        next: null,
        page_count: 1,
        page_size: results.length,
        previous: null,
        results,
      };
    }
  }

  // This probably means there is an infinite loop.
  // Possibilities:
  // - The callback isn't advancing pages correctly
  // - The API is responding with something unexpected.
  throw new Error(
    `Fetched too many pages (maxAllowedPages=${maxAllowedPages})`,
  );
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
  return callApi<ResponseOnly<ExternalVersionWithContent>>({
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
  return callApi<ResponseOnly<ExternalVersionsList>>({
    apiState,
    endpoint: `reviewers/addon/${addonId}/versions/`,
  });
};

export const logOutFromServer = async (apiState: ApiState) => {
  return callApi<ResponseOnly<{ ok: boolean }>>({
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
  return callApi<ResponseOnly<ExternalUser>>({
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
  return callApi<ResponseOnly<ExternalVersionWithDiff>>({
    apiState,
    endpoint: `reviewers/addon/${addonId}/versions/${baseVersionId}/compare_to/${headVersionId}`,
    query: path ? { file: path } : undefined,
  });
};

type CommentRequest = {
  canned_response?: number;
  comment?: string;
  filename?: string | null;
  lineno?: number | null;
};

export const createOrUpdateComment = async ({
  /* istanbul ignore next */
  _callApi = callApi,
  addonId,
  apiState,
  cannedResponseId,
  comment,
  commentId,
  fileName,
  line,
  versionId,
}: {
  _callApi?: typeof callApi;
  addonId: number;
  apiState: ApiState;
  cannedResponseId?: number;
  comment?: string;
  commentId: number | undefined;
  fileName: string | null;
  line: number | null;
  versionId: number;
}) => {
  if (cannedResponseId === undefined && comment === undefined) {
    throw new Error('Either cannedResponseId or comment must be specified');
  }
  if (cannedResponseId !== undefined && comment !== undefined) {
    throw new Error('cannedResponseId and comment cannot both be specified');
  }

  let endpoint = `reviewers/addon/${addonId}/versions/${versionId}/draft_comments`;
  if (commentId) {
    endpoint = `${endpoint}/${commentId}`;
  }

  return _callApi<{
    requestData: CommentRequest;
    successfulResponse: ExternalComment;
  }>({
    apiState,
    bodyData: {
      canned_response: cannedResponseId,
      comment,
      filename: fileName,
      lineno: line,
    },
    endpoint,
    method: commentId ? HttpMethod.PATCH : HttpMethod.POST,
  });
};

type GetCommentsResultsItem = ExternalComment;

export type GetCommentsResponse = PaginatedResponse<GetCommentsResultsItem[]>;

export type GetCommentsParams = {
  _callApi?: typeof callApi;
  addonId: number;
  apiState: ApiState;
  endpointUrl?: GetCommentsResponse['next'];
  versionId: number;
};

export const getComments = async ({
  _callApi = callApi,
  addonId,
  apiState,
  endpointUrl,
  versionId,
}: GetCommentsParams) => {
  let endpoint;

  if (!endpointUrl) {
    endpoint = `reviewers/addon/${addonId}/versions/${versionId}/draft_comments`;
  }

  return _callApi<ResponseOnly<GetCommentsResponse>>({
    apiState,
    endpointUrl: endpointUrl || undefined,
    endpoint,
    method: HttpMethod.GET,
  });
};

export const getAllComments = async ({
  _fetchAllPages = fetchAllPages,
  _getComments = getComments,
  ...params
}: {
  _fetchAllPages?: typeof fetchAllPages;
  _getComments?: typeof getComments;
} & Omit<GetCommentsParams, 'endpointUrl'>) => {
  return _fetchAllPages<GetCommentsResultsItem>((nextUrl) => {
    return _getComments({ ...params, endpointUrl: nextUrl });
  });
};

export const deleteComment = async ({
  _callApi = callApi,
  addonId,
  commentId,
  apiState,
  versionId,
}: {
  _callApi?: typeof callApi;
  addonId: number;
  apiState: ApiState;
  commentId: number;
  versionId: number;
}) => {
  return _callApi<EmptyRequestAndResponse>({
    apiState,
    endpoint: `reviewers/addon/${addonId}/versions/${versionId}/draft_comments/${commentId}`,
    method: HttpMethod.DELETE,
  });
};
