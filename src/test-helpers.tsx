import pathLib from 'path';

import * as React from 'react';
import PropTypes from 'prop-types';
import { History, Location } from 'history';
import { ShallowWrapper, shallow } from 'enzyme';
import { Store } from 'redux';
import log from 'loglevel';

import configureStore, { ThunkActionCreator } from './configureStore';
import { ApplicationState } from './reducers';
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
  ExternalVersionWithContent,
  ExternalVersionWithDiff,
  ExternalVersionsList,
  ExternalVersionsListItem,
  Version,
  VersionEntryType,
  actions as versionsActions,
  createInternalDiff,
  createInternalVersion,
  createInternalVersionEntry,
} from './reducers/versions';
import LinterProvider, {
  LinterProviderInfo,
} from './components/LinterProvider';
import ContentShell from './components/FullscreenGrid/ContentShell';
import { PanelAttribs } from './components/FullscreenGrid';

/* eslint-disable @typescript-eslint/camelcase */

export const fakeVersionEntry: ExternalVersionEntry = Object.freeze({
  depth: 0,
  // This is always the base filename, no subdirectories.
  filename: 'manifest.json',
  mime_category: 'text' as VersionEntryType,
  mimetype: 'application/json',
  modified: '2017-08-15T12:01:13Z',
  // This is the complete relative path. For example, it might include
  // subdirectories like scripts/background.js
  path: 'manifest.json',
  sha256: 'some-sha',
  status: 'M',
  size: 123,
});

export const createFakeEntry = (
  mime_category: VersionEntryType,
  path: string,
  mimetype: string = 'application/json',
): ExternalVersionEntry => {
  return {
    ...fakeVersionEntry,
    filename: path,
    mime_category,
    mimetype,
    path,
  };
};

export const fakeVersionFile: ExternalVersionFileWithContent = Object.freeze({
  content: 'some file content',
  created: '2017-08-15T12:01:13Z',
  download_url: 'https://example.org/download/manifest.json',
  entries: {
    'manifest.json': fakeVersionEntry,
  },
  hash: 'some-hash',
  id: 789,
  is_mozilla_signed_extension: true,
  is_restart_required: false,
  is_webextension: true,
  permissions: [],
  platform: 'all',
  selected_file: 'manifest.json',
  size: 123,
  status: 'public',
  url: 'http://example.com/edit/',
});

export const fakeVersionAddon: ExternalVersionAddon = Object.freeze({
  icon_url: 'some-icon-url',
  id: 111,
  name: { 'en-US': 'addon name' },
  slug: 'addon-slug',
});

export const fakeVersion: ExternalVersionWithContent = Object.freeze({
  addon: fakeVersionAddon,
  channel: 'some channel',
  compatibility: {
    firefox: {
      min: '1',
      max: '2',
    },
  },
  edit_url: 'http://example.com/edit/',
  file: fakeVersionFile,
  has_been_validated: true,
  id: 123,
  is_strict_compatibility_enabled: false,
  license: {
    id: 456,
    isCustom: true,
    name: { 'en-US': 'license name' },
    text: { 'en-US': 'license text' },
    url: 'http://example.com/license/',
  },
  release_notes: null,
  reviewed: '2017-08-15T12:01:13Z',
  url: 'http://example.com/',
  validation_url: 'http://example.com/validation/',
  validation_url_json: 'http://example.com/validation/json/',
  version: '1.0',
});

export const createExternalVersionWithEntries = (
  partialEntries: ({ path: string } & Partial<ExternalVersionEntry>)[],
  versionProps: Partial<ExternalVersionWithContent> = {},
) => {
  return {
    ...fakeVersion,
    ...versionProps,
    file: {
      ...fakeVersion.file,
      entries: partialEntries.reduce((entries, file) => {
        return {
          [file.path]: {
            ...fakeVersionEntry,
            filename: pathLib.basename(file.path),
            path: file.path,
            ...file,
          },
          ...entries,
        };
      }, {}),
    },
  };
};

// Try to use createVersionWithEntries instead, if possible, since that
// one is composed of a realistic external object.
export const createVersionWithInternalEntries = (
  entries: Version['entries'],
): Version => {
  return {
    ...createInternalVersion(fakeVersion),
    entries,
  };
};

export const createVersionWithEntries = (
  ...args: Parameters<typeof createExternalVersionWithEntries>
) => {
  return createInternalVersion(createExternalVersionWithEntries(...args));
};

export const getFakeVersionAndPathList = (
  entries: ({ path: string } & Partial<ExternalVersionEntry>)[],
) => {
  const pathList = entries.map((e) => e.path);

  const version = createVersionWithEntries(
    entries.map((params) =>
      createInternalVersionEntry({
        ...fakeVersionEntry,
        mime_category: 'text',
        status: 'M',
        ...params,
        filename: params.path,
      }),
    ),
  );
  version.selectedPath = pathList[0];

  return { pathList, version };
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

/* eslint-enable @typescript-eslint/camelcase */

export const fakeVersionWithDiff: ExternalVersionWithDiff = {
  ...fakeVersion,
  file: {
    ...fakeVersion.file,
    diff: fakeExternalDiff,
  },
};

export const fakeVersionsListItem: ExternalVersionsListItem = {
  id: 1541798,
  channel: 'unlisted',
  version: '1.5.0',
};

export const fakeVersionsList: ExternalVersionsList = [
  {
    ...fakeVersionsListItem,
    id: 1541798,
    channel: 'unlisted',
    version: '1.5.0',
  },
  {
    ...fakeVersionsListItem,
    id: 1541794,
    channel: 'listed',
    version: '1.4.0',
  },
  {
    ...fakeVersionsListItem,
    id: 1541786,
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

  if (!map[path]) {
    /* istanbul ignore next */
    throw new Error(`Somehow no messages were mapped to path "${path}"`);
  }
  return map[path];
};

export const createFakeCompareInfo = ({
  baseVersionId = 1,
  headVersionId = 2,
  mimeType = 'mime/type',
  version = fakeVersionWithDiff,
} = {}) => {
  return {
    diff: createInternalDiff({
      baseVersionId,
      headVersionId,
      version,
    }),
    mimeType,
  };
};

export const createFakeLocation = (props = {}): Location => {
  return {
    hash: '',
    key: 'some-key',
    pathname: '/some/url',
    search: '',
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
  shallowOptions?: object;
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
    ...extraProps,
  };
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

export const createStoreWithVersion = (
  /* istanbul ignore next */
  version = fakeVersion,
) => {
  const store = configureStore();
  store.dispatch(versionsActions.loadVersionInfo({ version }));
  return store;
};
