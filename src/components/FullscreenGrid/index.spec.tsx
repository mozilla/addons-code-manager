import * as React from 'react';
import { shallow } from 'enzyme';

import FullscreenGrid, { Header, NavPanel, AltPanel, ContentPanel } from '.';

const allComponents: {
  [key: string]:
    | typeof FullscreenGrid
    | typeof Header
    | typeof NavPanel
    | typeof AltPanel
    | typeof ContentPanel;
} = {
  FullscreenGrid,
  Header,
  NavPanel,
  AltPanel,
  ContentPanel,
};

describe(__filename, () => {
  it.each(Object.keys(allComponents))(
    'Component <%s> renders children',
    (componentKey) => {
      const Component = allComponents[componentKey];
      const childClass = 'example-class';

      const root = shallow(
        <Component>
          <div className={childClass} />
        </Component>,
      );

      expect(root.find(`.${childClass}`)).toHaveLength(1);
    },
  );

  it.each(Object.keys(allComponents))(
    'Component <%s> accepts a custom className',
    (componentKey) => {
      const Component = allComponents[componentKey];
      const className = 'example-class';

      const root = shallow(
        <Component className={className}>
          <span />
        </Component>,
      );

      expect(root).toHaveClassName(className);
    },
  );
});
