import * as React from 'react';
import { shallow } from 'enzyme';

import configureStore from '../../configureStore';
import { shallowUntilTarget } from '../../test-helpers';

import FullscreenGrid, { Header, ContentShell, FullscreenGridBase } from '.';

describe(__filename, () => {
  it('exposes ContentShell to ensure backward compatibility', () => {
    expect(ContentShell).toBeDefined();
  });

  describe('FullscreenGrid', () => {
    const render = (element: JSX.Element) => {
      return shallowUntilTarget(element, FullscreenGridBase, {
        shallowOptions: {
          context: { store: configureStore() },
        },
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
