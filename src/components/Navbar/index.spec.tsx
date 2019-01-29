import { shallow } from 'enzyme';
import React from 'react';

import LoginButton from '../LoginButton';

import Navbar from '.';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallow(<Navbar onLogOut={() => null} profile={null} {...props} />);
  };

  const createProfile = (name = 'Bob') => {
    return { name };
  };

  describe('when a profile is provided', () => {
    it('renders a username', () => {
      const name = 'Bob';
      const root = render({ profile: createProfile(name) });

      expect(root.find('.Navbar-username')).toHaveText(name);
    });

    it('configures a log out button', () => {
      const onLogOut = () => null;
      const root = render({ onLogOut, profile: createProfile() });

      expect(root.find('.Navbar-logOut')).toHaveProp('onClick', onLogOut);
    });

    it('does not render a log in button', () => {
      const root = render({ profile: createProfile() });

      expect(root.find(LoginButton)).toHaveLength(0);
    });
  });

  describe('when profile is null', () => {
    it('does not render a username', () => {
      const root = render({ profile: null });

      expect(root.find('.Navbar-username')).toHaveLength(0);
    });

    it('renders a log in button', () => {
      const root = render({ profile: null });

      expect(root.find(LoginButton)).toHaveLength(1);
    });

    it('does not render a log out button', () => {
      const root = render({ profile: null });

      expect(root.find('.Navbar-logOut')).toHaveLength(0);
    });
  });
});
