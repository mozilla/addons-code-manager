import * as React from 'react';
import { shallow } from 'enzyme';

import FullscreenGrid, { Header, ContentShell } from '.';

describe(__filename, () => {
  it('exposes ContentShell', () => {
    expect(ContentShell).toBeDefined();
  });

  describe('FullscreenGrid', () => {
    it('accepts a custom className', () => {
      const className = 'MyGrid';
      const root = shallow(
        <FullscreenGrid className={className}>
          <Header />
          <ContentShell />
        </FullscreenGrid>,
      );

      expect(root.find(`.${className}`)).toHaveLength(1);
    });

    it('renders children', () => {
      const childClass = 'ChildExample';

      const root = shallow(
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
