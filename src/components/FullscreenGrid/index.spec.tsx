import * as React from 'react';
import { shallow } from 'enzyme';

import ContentShell from './ContentShell';
import configureStore from '../../configureStore';
import { actions as fullscreenGridActions } from '../../reducers/fullscreenGrid';
import { shallowUntilTarget } from '../../test-helpers';
import styles from './styles.module.scss';

import FullscreenGrid, { Header, FullscreenGridBase } from '.';

describe(__filename, () => {
  describe('FullscreenGrid', () => {
    const render = (
      element: JSX.Element,
      { store = configureStore() } = {},
    ) => {
      return shallowUntilTarget(element, FullscreenGridBase, {
        shallowOptions: { context: { store } },
      });
    };

    it('accepts a custom className', () => {
      const className = 'MyGrid';
      const root = render(
        <FullscreenGrid className={className}>
          <Header />
          <ContentShell />
        </FullscreenGrid>,
      );

      expect(root.find(`.${className}`)).toHaveLength(1);
    });

    it('renders children', () => {
      const childClass = 'ChildExample';

      const root = render(
        <FullscreenGrid>
          <Header />
          <ContentShell>
            <div className={childClass} />
          </ContentShell>
        </FullscreenGrid>,
      );

      expect(root.find(`.${childClass}`)).toHaveLength(1);
    });

    it('renders with a default CSS class', () => {
      const root = render(<FullscreenGrid />);

      expect(root).toHaveClassName(styles.FullscreenGrid);
      expect(root).not.toHaveClassName(styles.hasACollapsedMainSidePanel);
    });

    it('sets an extra CSS class when the main side panel is collapsed', () => {
      const store = configureStore();
      store.dispatch(fullscreenGridActions.toggleMainSidePanel());

      const root = render(<FullscreenGrid />, { store });

      expect(root).toHaveClassName(styles.hasACollapsedMainSidePanel);
    });
  });

  describe('Header', () => {
    it('accepts a custom className', () => {
      const className = 'MyHeader';
      const root = shallow(<Header className={className} />);

      expect(root.find(`.${className}`)).toHaveLength(1);
    });

    it('renders children', () => {
      const childClass = 'ChildExample';

      const root = shallow(
        <Header>
          <div className={childClass} />
        </Header>,
      );

      expect(root.find(`.${childClass}`)).toHaveLength(1);
    });
  });
});
