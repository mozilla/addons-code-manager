/* eslint @typescript-eslint/camelcase: 0 */
/* global fetchMock */
import pathLib from 'path';

import queryString from 'query-string';
import * as React from 'react';
import PropTypes from 'prop-types';
import { History, Location } from 'history';
import { ShallowRendererProps, ShallowWrapper, shallow } from 'enzyme';
import { Store } from 'redux';
import log from 'loglevel';
import { ChangeInfo, Tokens } from 'react-diff-view';
import { createAction } from 'typesafe-actions';

import {
  GetCommentsResponse,
  PaginatedResponse,
  ErrorResponseType,
} from './api';
import configureStore, { ThunkActionCreator } from './configureStore';
import { ApplicationState } from './reducers';
import {
  Comment,
  ExternalComment,
  actions as commentsActions,
  createInternalComment,
} from './reducers/comments';
import {
  ExternalLinterResult,
  ExternalLinterMessage,
  LinterMessagesByPath,
  getMessageMap,
} from './reducers/linter';
import { ExternalUser } from './reducers/users';
import {
  ExternalChange,
  ExternalVersionAddon,
  ExternalVersionEntry,
  ExternalVersionFileWithContent,
  ExternalVersionFileWithDiff,
  ExternalVersionWithContent,
  ExternalVersionWithDiff,
  ExternalVersionsList,
  ExternalVersionsListItem,
  PartialExternalVersion,
  PartialExternalVersionFile,
  Version,
  VersionEntryType,
  actions as versionsActions,
  createEntryStatusMap,
  createInternalCompareInfo,
  createInternalVersion,
} from './reducers/versions';
import Commentable, {
  ChildrenArgValue as CommentableChildrenArgValue,
} from './components/Commentable';
import CommentList, {
  ChildrenArgValue as CommentListChildrenArgValue,
} from './components/CommentList';
import LinterProvider, {
  LinterProviderInfo,
} from './components/LinterProvider';
import ContentShell, {
  PanelAttribs,
} from './components/FullscreenGrid/ContentShell';
import PopoverButton from './components/PopoverButton';

let _uniqueId = 0;

/*
 * Returns a unique sequential ID.
 */
export const nextUniqueId = () => {
  _uniqueId++;
  return _uniqueId;
};

export const fakeVersionEntry: ExternalVersionEntry = Object.freeze({
  depth: 0,
  // This is always the base filename, no subdirectories.
  filename: 'manifest.json',
  mime_category: 'text' as VersionEntryType,
  // This is the complete relative path. For example, it might include
  // subdirectories like scripts/background.js
  path: 'manifest.json',
  status: 'M',
});

export const createFakeEntry = (
  mime_category: VersionEntryType,
  path: string,
): ExternalVersionEntry => {
  return {
    ...fakeVersionEntry,
    filename: path,
    mime_category,
    path,
  };
};

const partialFakeVersionFile: PartialExternalVersionFile = {
  download_url: 'https://example.org/download/manifest.json',
  filename: 'manifest.json',
  id: 789,
  mime_category: 'text',
  mimetype: 'application/json',
  selected_file: 'manifest.json',
  sha256: 'some-sha',
  size: 123,
  uses_unknown_minified_code: false,
};

export const fakeVersionFileWithContent: ExternalVersionFileWithContent = Object.freeze(
  {
    ...partialFakeVersionFile,
    content: 'some file content',
  },
);

export const fakeExternalDiff = Object.freeze({
  path: 'manifest.json',
  size: 172,
  lines_added: 2,
  lines_deleted: 2,
  is_binary: false,
  mode: 'M',
  hunks: [
    {
      header: '@@ -1,6 +1,6 @@',
      old_start: 1,
      new_start: 1,
      old_lines: 6,
      new_lines: 6,
      changes: [
        {
          content: '{',
          type: 'normal' as ExternalChange['type'],
          old_line_number: 1,
          new_line_number: 1,
        },
        {
          content: '    "manifest_version": 2,',
          type: 'normal' as ExternalChange['type'],
          old_line_number: 2,
          new_line_number: 2,
        },
        {
          content: '    "version": "7",',
          type: 'delete' as ExternalChange['type'],
          old_line_number: 3,
          new_line_number: -1,
        },
        {
          content: '    "version": "8",',
          type: 'insert' as ExternalChange['type'],
          old_line_number: -1,
          new_line_number: 3,
        },
        {
          content:
            '    "name": "Awesome Screenshot - Capture, Annotate & More",',
          type: 'normal' as ExternalChange['type'],
          old_line_number: 4,
          new_line_number: 4,
        },
        {
          content: '    "description": "this is a new description"',
          type: 'delete' as ExternalChange['type'],
          old_line_number: 5,
          new_line_number: -1,
        },
        {
          content: '    "description": "this is a new version with files"',
          type: 'insert' as ExternalChange['type'],
          old_line_number: -1,
          new_line_number: 5,
        },
        {
          content: '}',
          type: 'normal' as ExternalChange['type'],
          old_line_number: 6,
          new_line_number: 6,
        },
      ],
    },
  ],
  old_path: 'manifest.json',
  parent: '514a8bd3cfb1ccae67dff61e3ea174bb444dfb00',
  hash: '054771578d3a903264bfd16ba71e5b4808a6764b',
  old_ending_new_line: true,
  new_ending_new_line: false,
});

export const fakeVersionFileWithDiff: ExternalVersionFileWithDiff = Object.freeze(
  {
    ...partialFakeVersionFile,
    diff: fakeExternalDiff,
  },
);

export const fakeVersionAddon: ExternalVersionAddon = Object.freeze({
  icon_url: 'some-icon-url',
  id: 111,
  name: { 'en-US': 'addon name' },
  slug: 'addon-slug',
});

export const partialFakeVersion: PartialExternalVersion = {
  addon: fakeVersionAddon,
  channel: 'some channel',
  file_entries: {
    'manifest.json': fakeVersionEntry,
  },
  has_been_validated: true,
  id: 123,
  reviewed: '2017-08-15T12:01:13Z',
  url: 'http://example.com/',
  validation_url: 'http://example.com/validation/',
  validation_url_json: 'http://example.com/validation/json/',
  version: '1.0',
};

export const fakeVersionWithContent: ExternalVersionWithContent = Object.freeze(
  {
    ...partialFakeVersion,
    file: fakeVersionFileWithContent,
  },
);

export const createExternalVersionWithEntries = (
  partialEntries: ({ path: string } & Partial<ExternalVersionEntry>)[],
  {
    addonId = nextUniqueId(),
    diff = null,
    id = fakeVersionWithContent.id,
    selected_file = fakeVersionWithContent.file.selected_file,
  }: {
    addonId?: number;
    diff?: typeof fakeExternalDiff | null;
    id?: typeof fakeVersionWithContent.id;
    selected_file?: typeof fakeVersionWithContent.file.selected_file;
  } = {},
) => {
  return {
    ...fakeVersionWithContent,
    id,
    addon: { ...fakeVersionAddon, id: addonId },
    file: {
      ...fakeVersionWithContent.file,
      diff,
      selected_file,
    },
    file_entries: partialEntries.reduce((entries, file) => {
      return {
        ...entries,
        [file.path]: {
          ...fakeVersionEntry,
          filename: pathLib.basename(file.path),
          path: file.path,
          ...file,
        },
      };
    }, {}),
  };
};

// Try to use createVersionWithEntries instead, if possible, since that
// one is composed of a realistic external object.
export const createVersionWithInternalEntries = (
  entries: Version['entries'],
): Version => {
  return {
    ...createInternalVersion(fakeVersionWithContent),
    id: nextUniqueId(),
    entries,
  };
};

export const createVersionWithEntries = (
  ...args: Parameters<typeof createExternalVersionWithEntries>
) => {
  return createInternalVersion(createExternalVersionWithEntries(...args));
};

export const createVersionAndEntryStatusMap = (
  ...args: Parameters<typeof createExternalVersionWithEntries>
) => {
  const externalVersion = createExternalVersionWithEntries(...args);
  return {
    version: createInternalVersion(externalVersion),
    entryStatusMap: createEntryStatusMap(externalVersion),
  };
};

export const getFakeVersionAndPathList = (
  entries: ({ path: string } & Partial<ExternalVersionEntry>)[],
) => {
  const pathList = entries.map((e) => e.path);

  const externalEntries: ExternalVersionEntry[] = entries.map((params) => ({
    ...fakeVersionEntry,
    mime_category: 'text',
    ...params,
    filename: params.path,
  }));

  const { version, entryStatusMap } = createVersionAndEntryStatusMap(
    externalEntries,
  );

  version.selectedPath = pathList[0];

  return { entryStatusMap, pathList, version };
};

export const fakeUser: ExternalUser = Object.freeze({
  average_addon_rating: 4.3,
  biography: 'I love making add-ons!',
  created: '2017-08-15T12:01:13Z',
  display_name: null,
  email: 'bob@somewhere.com',
  fxa_edit_email_url: 'https://example.com/settings',
  has_anonymous_display_name: false,
  has_anonymous_username: false,
  homepage: null,
  id: 1,
  is_addon_developer: false,
  is_artist: false,
  location: null,
  name: 'Bob',
  num_addons_listed: 1,
  occupation: null,
  permissions: ['a-fake-permission'],
  picture_type: '',
  picture_url: `https://example.com/anon_user.png`,
  url: null,
  username: 'user-1234',
});

export const fakeExternalLinterMessage = Object.freeze({
  column: 2,
  context: ['<code>'],
  description: 'To prevent vulnerabilities...',
  file: 'chrome/content/youtune.js',
  for_appversions: {
    '{ec8030f7-c20a-464f-9b0e-13a3a9e97384}': ['4.0b1'],
  },
  id: ['UNSAFE_VAR_ASSIGNMENT'],
  line: 226,
  message: 'on* attribute being set using setAttribute',
  tier: 3,
  type: 'notice',
  uid: '9a07163bb74e476c96a2bd467a2bbe52',
}) as ExternalLinterMessage;

export const fakeExternalLinterResult = Object.freeze({
  error: null,
  full_report_url: '/upload/d5d993a5a2fa4b759ae2fa3b2eda2a38',
  upload: 'd5d993a5a2fa4b759ae2fa3b2eda2a38',
  url: '/upload/d5d993a5a2fa4b759ae2fa3b2eda2a38/json',
  validation: {
    detected_type: 'extension',
    ending_tier: 5,
    errors: 0,
    message_tree: {},
    messages: [fakeExternalLinterMessage],
    metadata: {},
    notices: 2,
    success: false,
    warnings: 5,
  },
}) as ExternalLinterResult;

/* eslint-enable @typescript-eslint/camelcase */

export const fakeVersionWithDiff: ExternalVersionWithDiff = Object.freeze({
  ...partialFakeVersion,
  file: fakeVersionFileWithDiff,
});

export const fakeVersionsListItem: ExternalVersionsListItem = {
  id: nextUniqueId(),
  channel: 'unlisted',
  version: '1.5.0',
};

export const fakeVersionsList: ExternalVersionsList = [
  {
    ...fakeVersionsListItem,
    id: nextUniqueId(),
    channel: 'unlisted',
    version: '1.5.0',
  },
  {
    ...fakeVersionsListItem,
    id: nextUniqueId(),
    channel: 'listed',
    version: '1.4.0',
  },
  {
    ...fakeVersionsListItem,
    id: nextUniqueId(),
    channel: 'listed',
    version: '1.3.0',
  },
];

export const createFakeExternalLinterResult = ({
  messages,
}: {
  messages: Partial<ExternalLinterMessage>[];
}): ExternalLinterResult => {
  return {
    ...fakeExternalLinterResult,
    validation: {
      ...fakeExternalLinterResult.validation,
      messages: messages.map((msg) => {
        return { ...fakeExternalLinterMessage, ...msg };
      }),
    },
  };
};

export const createFakeLinterMessagesByPath = ({
  messages,
  path = 'scripts/background.js',
}: {
  messages: Partial<ExternalLinterMessage>[];
  path?: string;
}): LinterMessagesByPath => {
  const map = getMessageMap(
    createFakeExternalLinterResult({
      messages: messages.map((msg) => {
        return { ...msg, file: path };
      }),
    }),
  );

  if (!map.byPath[path]) {
    /* istanbul ignore next */
    throw new Error(`Somehow no messages were mapped to path "${path}"`);
  }
  return map.byPath[path];
};

export const createFakeCompareInfo = ({
  baseVersionId = 1,
  headVersionId = 2,
  version = fakeVersionWithDiff,
}: {
  baseVersionId?: number;
  headVersionId?: number;
  version?: ExternalVersionWithDiff;
} = {}) => {
  return createInternalCompareInfo({
    baseVersionId,
    headVersionId,
    version,
  });
};

export const createFakeLocation = ({
  searchQuery,
  ...props
}: { searchQuery?: Record<string, string> } & Partial<
  Location
> = {}): Location => {
  return {
    hash: '',
    key: 'some-key',
    pathname: '/some/url',
    search: searchQuery ? `?${queryString.stringify(searchQuery)}` : '',
    state: {},
    ...props,
  };
};

export const createFakeHistory = ({
  location = createFakeLocation(),
} = {}): History => {
  return {
    action: 'PUSH',
    block: jest.fn(),
    createHref: jest.fn(),
    go: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
    length: 1,
    listen: jest.fn(),
    location,
    push: jest.fn(),
    replace: jest.fn(),
  };
};

export const createContextWithFakeRouter = ({
  history = createFakeHistory(),
  // We tell TS that `location` is a nullable Location object.
  location = null as Location | null,
  match = {},
  ...overrides
} = {}) => {
  return {
    context: {
      router: {
        history,
        route: {
          location: location || history.location,
          match,
        },
      },
    },
    // Enzyme's mount() seems to validate the prop-types by throwing
    // invariant errors.
    // See https://github.com/mozilla/addons-code-manager/issues/404
    childContextTypes: {
      router: PropTypes.object.isRequired,
    },
    ...overrides,
  };
};

/*
 * Repeatedly render a component tree using enzyme.shallow() until
 * finding and rendering TargetComponent.
 *
 * This is useful for testing a component wrapped in one or more
 * HOCs (higher order components).
 *
 * The `componentInstance` parameter is a React component instance.
 * Example: <MyComponent {...props} />
 *
 * The `targetComponent` parameter is the React class (or function) that
 * you want to retrieve from the component tree.
 */
type ShallowUntilTargetOptions = {
  maxTries?: number;
  shallowOptions?: ShallowRendererProps;
  _shallow?: typeof shallow;
};

export const shallowUntilTarget = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentInstance: React.ReactElement<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targetComponent: React.JSXElementConstructor<any>,
  {
    maxTries = 10,
    shallowOptions = {},
    _shallow = shallow,
  }: ShallowUntilTargetOptions = {},
) => {
  let root = _shallow(componentInstance, shallowOptions);

  if (typeof root.type() === 'string') {
    // If type() is a string then it's a DOM Node.
    // If it were wrapped, it would be a React component.
    throw new Error('Cannot unwrap this component because it is not wrapped');
  }

  for (let tries = 1; tries <= maxTries; tries++) {
    if (root.is(targetComponent)) {
      // Now that we found the target component, render it.
      return root.shallow(shallowOptions);
    }
    // Unwrap the next component in the hierarchy.
    root = root.dive();
  }

  throw new Error(
    `Could not find ${targetComponent} in rendered instance: ${componentInstance};
     gave up after ${maxTries} tries`,
  );
};

/*
 * Creates a fake thunk for testing.
 *
 * Let's say you had a real thunk like this:
 *
 * const doLogout = () => {
 *   return (dispatch, getState) => {
 *     // Make a request to the API...
 *     dispatch({ type: 'LOG_OUT' });
 *   };
 * };
 *
 * You can replace this thunk for testing as:
 *
 * const fakeThunk = createFakeThunk();
 * render({ _doLogout: fakeThunk.createThunk });
 *
 * You can make an assertion that it was called like:
 *
 * expect(dispatch).toHaveBeenCalledWith(fakeThunk.thunk);
 */
export const createFakeThunk = () => {
  // This is a placeholder for the dispatch callback function,
  // the thunk itself.
  // In reality it would look like (dispatch, getState) => {}
  // but here it gets set to a string for easy test assertions.
  const dispatchCallback = '__thunkDispatchCallback__';

  return {
    // This is a function that creates the dispatch callback.
    createThunk: jest.fn().mockReturnValue(dispatchCallback),
    thunk: dispatchCallback,
  };
};

/*
 * Sets up a thunk for testing.
 *
 * Let's say you had a real thunk like this:
 *
 * const doLogout = () => {
 *   return (dispatch, getState) => {
 *     // Make a request to the API...
 *     dispatch({ type: 'LOG_OUT' });
 *   };
 * };
 *
 * You can set it up for testing like this:
 *
 * const { dispatch, thunk, store } = thunkTester({
 *   createThunk: () => doLogout(),
 * });
 *
 * await thunk();
 *
 * expect(dispatch).toHaveBeenCalledWith({ type: 'LOG_OUT' });
 *
 */
export const thunkTester = ({
  store = configureStore(),
  createThunk,
}: {
  store?: Store<ApplicationState>;
  createThunk: () => ThunkActionCreator;
}) => {
  const thunk = createThunk();
  const dispatch = jest.fn();

  return {
    dispatch,
    // This simulates how the middleware will run the thunk.
    thunk: () => thunk(dispatch, () => store.getState(), undefined),
    store,
  };
};

export const createFakeLogger = () => {
  return {
    ...log,
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
};

export const spyOn = <T extends {}>(
  object: T,
  method: jest.FunctionPropertyNames<T>,
) => {
  return jest.spyOn(object, method).mockImplementation(jest.fn());
};

export const createFakeEvent = (extraProps = {}) => {
  return {
    currentTarget: jest.fn(),
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: jest.fn(),
    ...extraProps,
  };
};

export const createFakeChangeEvent = ({
  name,
  value,
}: {
  name: string;
  value: string;
}) => {
  return createFakeEvent({ target: { name, value } });
};

export type CreateKeydownEventParams = {
  altKey?: boolean;
  ctrlKey?: boolean;
  key: string;
  metaKey?: boolean;
  shiftKey?: boolean;
};

export const createKeydownEvent = ({
  altKey = false,
  ctrlKey = false,
  key,
  metaKey = false,
  shiftKey = false,
}: CreateKeydownEventParams) => {
  return new KeyboardEvent('keydown', {
    altKey,
    ctrlKey,
    key,
    metaKey,
    shiftKey,
  });
};

/*
 * Given a component that uses <LinterProvider>, simulate the content
 * returned by <LinterProvider>
 */
export const simulateLinterProvider = (
  root: ShallowWrapper,
  /* istanbul ignore next */
  {
    messageMap = undefined,
    messagesAreLoading = false,
    selectedMessageMap = undefined,
  }: Partial<LinterProviderInfo> = {},
) => {
  const provider = root.find(LinterProvider);
  expect(provider).toHaveLength(1);

  const renderWithLinter = provider.renderProp('children');
  // Simulate how LinterProvider will render its children prop.
  return renderWithLinter({
    messageMap,
    messagesAreLoading,
    selectedMessageMap,
  });
};

/*
 * Creates a helper for simulating the `children` render prop of a
 * component.
 *
 * This is intended for testing render prop components that are typically
 * used multiple times, like in a list.
 *
 * The `children` render prop can only take one argument.
 */
const multiRenderPropSimulator = <RenderArgValue extends {}>({
  Component,
  renderArgValue,
  root,
}: {
  // A specific component type would not be helpful here because
  // ShallowWrapper does not enforce the Component's actual prop type
  // when calling renderProp('children')(...args), unfortunately.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>;
  renderArgValue: RenderArgValue;
  root: ShallowWrapper;
}) => {
  const shell = root.find(Component);

  return {
    shell,
    renderContent(oneShell = shell) {
      const render = oneShell.renderProp('children');
      return render(renderArgValue);
    },
  };
};

export type SimulateCommentableParams = {
  addCommentButton?: CommentableChildrenArgValue;
  root: ShallowWrapper;
};

/*
 * Given a component that uses <Commentable>, simulate the content
 * returned by <Commentable>
 */
export const simulateCommentable = ({
  // In reality this would be an instance of <AddComment /> but that
  // doesn't matter here.
  addCommentButton = <button type="button">Add</button>,
  root,
}: SimulateCommentableParams) => {
  return multiRenderPropSimulator<CommentableChildrenArgValue>({
    Component: Commentable,
    renderArgValue: addCommentButton,
    root,
  });
};

export type SimulateCommentListParams = {
  commentList?: CommentListChildrenArgValue;
  root: ShallowWrapper;
};

/*
 * Given a component that uses <CommentList>, simulate the content
 * returned by <CommentList>
 */
export const simulateCommentList = ({
  // In reality this would be a wrapper around an array of <Comment />
  // components but that doesn't matter here.
  commentList = <div />,
  root,
}: SimulateCommentListParams) => {
  return multiRenderPropSimulator<CommentListChildrenArgValue>({
    Component: CommentList,
    renderArgValue: commentList,
    root,
  });
};

/*
 * Given a ShallowWrapper for a component that renders ContentShell,
 * return a wrapper around one of its panel attributes.
 */
export const getContentShellPanel = (
  root: ShallowWrapper,
  panelAttr: PanelAttribs,
) => {
  const panel = root.find(ContentShell).prop(panelAttr);
  return shallow(<div>{panel}</div>);
};

/*
 * Returns a fake React ref that can be passed into a component instance.
 *
 * The `currentOverrides` parameters are applied to ref.current. By
 * default, ref.current will be a real DOM node so you'll need to
 * override any properties that the component may touch.
 */
export const createFakeRef = (
  /* istanbul ignore next */
  currentOverrides = {},
  { currentElement = document.createElement('div') } = {},
) => {
  return {
    ...React.createRef(),
    current: {
      ...currentElement,
      ...currentOverrides,
    },
  };
};

export const dispatchLoadVersionInfo = ({
  store,
  updatePathInfo = true,
  version,
}: {
  store: Store<ApplicationState>;
  updatePathInfo?: boolean;
  version: ExternalVersionWithContent | ExternalVersionWithDiff;
}): void => {
  store.dispatch(versionsActions.loadVersionInfo({ updatePathInfo, version }));
};

export const createStoreWithVersion = (
  /* istanbul ignore next */
  {
    version = fakeVersionWithContent,
    makeCurrent = false,
  }: {
    version?: ExternalVersionWithDiff | ExternalVersionWithContent;
    makeCurrent?: boolean;
  } = {},
) => {
  const store = configureStore();
  dispatchLoadVersionInfo({ store, version });
  if (makeCurrent) {
    store.dispatch(
      versionsActions.setCurrentVersionId({ versionId: version.id }),
    );
  }
  return store;
};

/*
 * Returns a localized string definition just like the external API would.
 * */
export const externallyLocalizedString = (
  value: string,
  locale = process.env.REACT_APP_DEFAULT_API_LANG as string,
) => {
  return {
    [locale]: value,
  };
};

export const createFakeExternalComment = (
  comment: Partial<ExternalComment> = {},
) => {
  return {
    canned_response: null,
    comment: 'Example comment about some code',
    id: nextUniqueId(),
    lineno: null,
    filename: null,
    user: {
      id: 1,
      name: null,
      url: null,
      username: 'some_user',
    },
    version_id: nextUniqueId(),
    ...comment,
  };
};

export const createFakeComment = (comment: Partial<Comment> = {}) => {
  return {
    ...createInternalComment(createFakeExternalComment()),
    ...comment,
  };
};

export const fakeAction = createAction('FAKE_ACTION');

type DispatchCommentsParams = {
  store?: Store;
  comments?: ExternalComment[];
  versionId?: number;
};

export const dispatchComments = ({
  store = configureStore(),
  /* istanbul ignore next */
  comments = [createFakeExternalComment()],
  versionId = nextUniqueId(),
}: DispatchCommentsParams = {}) => {
  store.dispatch(commentsActions.setComments({ versionId, comments }));

  return { store };
};

export const dispatchComment = ({
  /* istanbul ignore next */
  comment = createFakeExternalComment(),
  store = configureStore(),
  ...params
}: {
  comment?: ExternalComment;
} & Partial<Omit<DispatchCommentsParams, 'comments'>> = {}) => {
  return dispatchComments({ comments: [comment], store, ...params });
};

export const createStoreWithVersionComments = ({
  versionId = 1,
  comments = [createFakeExternalComment()],
} = {}) => {
  const version = { ...fakeVersionWithContent, id: versionId };
  const store = createStoreWithVersion({ version, makeCurrent: true });

  dispatchComments({ versionId, store, comments });

  return store;
};

export const createFakeApiPage = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PaginatedResponseType extends PaginatedResponse<any>
>({
  next = null,
  previous = null,
  page_size = 25,
  results = [],
  count = results.length,
  page_count = count > page_size ? Math.ceil(count / page_size) : 1,
}: Partial<PaginatedResponseType> = {}) => {
  return {
    count,
    next,
    page_count,
    page_size,
    previous,
    results,
  } as PaginatedResponseType;
};

export const createFakeCommentsResponse = (
  results = [createFakeExternalComment()],
) => {
  return createFakeApiPage<GetCommentsResponse>({ results });
};

export const createErrorResponse = (
  errorResponse = {
    error: new Error('Example error'),
  },
): ErrorResponseType => {
  return errorResponse;
};

export const setMockFetchResponseJSON = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  { contentType = 'application/json' } = {},
) => {
  fetchMock.mockResponse(JSON.stringify(data), {
    headers: {
      'content-type': contentType,
    },
  });
};

export const getInstance = <ComponentType extends React.Component>(
  root: ShallowWrapper,
) => root.instance() as ComponentType;

export const simulatePopover = (root: ShallowWrapper) => {
  const popover = root.find(PopoverButton);
  expect(popover).toHaveProp('content');
  return {
    content: shallow(<div>{popover.prop('content')}</div>),
    popover,
  };
};

export const fakeChangeInfo: ChangeInfo = Object.freeze({
  content: 'change-content',
  isDelete: false,
  isInsert: true,
  isNormal: false,
  lineNumber: 1,
  newLineNumber: undefined,
  oldLineNumber: 1,
  type: 'insert',
});

export const fakeChange: ExternalChange = Object.freeze({
  content: 'change-content',
  new_line_number: 1,
  old_line_number: 1,
  type: 'normal',
});

export const fakeTokens: Tokens = Object.freeze({
  new: [{ type: 'token type', value: 'token value' }],
  old: [{ type: 'token type', value: 'token value' }],
});
