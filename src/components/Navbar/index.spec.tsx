import { shallow } from 'enzyme';
import React from 'react';

import LoginButton from '../LoginButton';
import styles from './styles.module.scss';

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

      expect(root.find(`.${styles.username}`)).toHaveText(name);
    });

    it('renders a log out button', () => {
      const onLogOut = () => null;
      const root = render({ onLogOut, profile: createProfile() });

      expect(root.find(`.${styles.logOut}`)).toHaveLength(1);
    });

    it('does not render a log in button', () => {
      const root = render({ profile: createProfile() });

      expect(root.find(LoginButton)).toHaveLength(0);
    });
  });

  describe('when profile is null', () => {
    it('does not render a username', () => {
      const root = render({ profile: null });

      expect(root.find(`.${styles.username}`)).toHaveLength(0);
    });

    it('renders a log in button', () => {
      const root = render({ profile: null });

      expect(root.find(LoginButton)).toHaveLength(1);
    });

    it('does not render a log out button', () => {
      const root = render({ profile: null });

      expect(root.find(`.${styles.logOut}`)).toHaveLength(0);
    });
  });

  describe('Log out button', () => {
    it('calls onLogOut when clicked', () => {
      const onLogOutMock = jest.fn();
      const root = render({ onLogOut: onLogOutMock, profile: createProfile() });

      root.find(`.${styles.logOut}`).simulate('click');
      expect(onLogOutMock).toHaveBeenCalled();
    });
  });
});
