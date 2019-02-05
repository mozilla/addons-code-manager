import PropTypes from 'prop-types';
import { History, Location } from 'history';
import { shallow } from 'enzyme';

import { ExternalUser } from './reducers/users';

export const fakeUser: ExternalUser = Object.freeze({
  /* eslint-disable @typescript-eslint/camelcase */
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
  /* eslint-enable @typescript-eslint/camelcase */
});

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
type ShallowUntilTargetParams = {
  componentInstance: React.ReactElement<any>;
  targetComponent: React.JSXElementConstructor<any>;
  options?: {
    maxTries?: number;
    shallowOptions?: object;
    _shallow?: typeof shallow;
  };
};

export const shallowUntilTarget = ({
  componentInstance,
  targetComponent,
  options: { maxTries = 10, shallowOptions = {}, _shallow = shallow } = {},
}: ShallowUntilTargetParams) => {
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
