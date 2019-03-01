import PropTypes from 'prop-types';
import { History, Location } from 'history';
import { shallow } from 'enzyme';
import { Store } from 'redux';
import log from 'loglevel';

import configureStore, {
  ApplicationState,
  ThunkActionCreator,
} from './configureStore';
import { ExternalUser } from './reducers/users';
import {
  ExternalVersion,
  ExternalVersionAddon,
  ExternalVersionEntry,
  ExternalVersionFile,
  VersionEntryType,
} from './reducers/versions';

/* eslint-disable @typescript-eslint/camelcase */

export const fakeVersionEntry: ExternalVersionEntry = Object.freeze({
  depth: 0,
  filename: 'manifest.json',
  mime_category: 'text' as VersionEntryType,
  mimetype: 'application/json',
  modified: '2017-08-15T12:01:13Z',
  path: 'manifest.json',
  sha256: 'some-sha',
  size: 123,
});

export const fakeVersionFile: ExternalVersionFile = Object.freeze({
  content: 'some file content',
  created: '2017-08-15T12:01:13Z',
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

export const fakeVersion: ExternalVersion = Object.freeze({
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

/* eslint-enable @typescript-eslint/camelcase */

export const createFakeLocation = (props = {}): Location<{}> => {
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
  location = null,
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

export const getFakeLogger = () => {
  return {
    ...log,
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };
};

export const spyOn = <T extends {}>(
  object: T,
  method: jest.FunctionPropertyNames<T>,
) => {
  return jest.spyOn(object, method).mockImplementation(jest.fn());
};
