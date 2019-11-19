import { Location } from 'history';
import * as React from 'react';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import { actions as fullscreenGridActions } from '../../reducers/fullscreenGrid';
import {
  createContextWithFakeRouter,
  createFakeLocation,
  spyOn,
  shallowUntilTarget,
} from '../../test-helpers';
import ContentShell, { ContentShellBase, PublicProps } from './ContentShell';
import { PublicProps as SidePanelProps } from '../SidePanel';
import styles from './styles.module.scss';

describe(__filename, () => {
  type RenderParams = PublicProps & { location?: Location; store?: Store };

  const render = ({
    location = createFakeLocation(),
    store = configureStore(),
    ...props
  }: RenderParams = {}) => {
    const shallowOptions = createContextWithFakeRouter({ location });
    return shallowUntilTarget(<ContentShell {...props} />, ContentShellBase, {
      shallowOptions: {
        ...shallowOptions,
        context: {
          ...shallowOptions.context,
          store,
        },
      },
    });
  };

  it('accepts a custom className', () => {
    const className = 'MyContent';
    const root = render({ className });

    expect(root.find(`.${className}`)).toHaveLength(1);
  });

  it('renders children', () => {
    const childClass = 'ChildExample';

    const root = render({ children: <div className={childClass} /> });

    expect(root.find(`.${childClass}`)).toHaveLength(1);
  });

  it('renders topContent', () => {
    const topContent = <div />;

    const root = render({ topContent });

    const content = root.find(`.${styles.topContent}`);
    expect(content).toHaveLength(1);
    expect(content).toHaveProp('children', topContent);
  });

  it('does not render a topContent shell without topContent', () => {
    const root = render({ topContent: undefined });

    const content = root.find(`.${styles.topContent}`);
    expect(content).toHaveLength(0);
  });

  it('renders a mainSidePanel', () => {
    const panel = <div className="ChildExample" />;

    const root = render({ mainSidePanel: panel });

    const mainSidePanel = root.find(`.${styles.mainSidePanel}`);
    expect(mainSidePanel).toHaveProp('children', panel);
  });

  it('accepts a mainSidePanelClass', () => {
    const customClass = 'Example';

    const root = render({ mainSidePanelClass: customClass });

    expect(root.find(`.${customClass}`)).toHaveLength(1);
  });

  it('renders a borderless main SidePanel when mainSidePanelIsBorderless is true', () => {
    const root = render({
      mainSidePanelIsBorderless: true,
    });

    expect(root.find(`.${styles.mainSidePanel}`)).toHaveProp(
      'borderless',
      true,
    );
  });

  it('renders the border of the main SidePanel by default', () => {
    const root = render();

    expect(root.find(`.${styles.mainSidePanel}`)).toHaveProp(
      'borderless',
      false,
    );
  });

  it('renders an altSidePanel', () => {
    const panel = <div className="ChildExample" />;

    const root = render({ altSidePanel: panel });

    const altSidePanel = root.find(`.${styles.altSidePanel}`);
    expect(altSidePanel).toHaveProp('children', panel);
  });

  it('accepts an altSidePanelClass', () => {
    const customClass = 'Example';

    const root = render({ altSidePanelClass: customClass });

    expect(root.find(`.${customClass}`)).toHaveLength(1);
  });

  it('renders the main side panel expanded by default', () => {
    const root = render();

    expect(root.find(`.${styles.mainSidePanel}`)).toHaveProp(
      'isExpanded',
      true,
    );
  });

  it('renders a collapsed main side panel', () => {
    const store = configureStore();
    store.dispatch(fullscreenGridActions.toggleMainSidePanel());

    const root = render({ store });

    expect(root.find(`.${styles.mainSidePanel}`)).toHaveLength(1);
    expect(root.find(`.${styles.mainSidePanel}`)).toHaveProp(
      'isExpanded',
      false,
    );
    expect(root.find(`.${styles.mainSidePanel}`)).toHaveProp(
      'toggleLeft',
      false,
    );
  });

  it('dispatches toggleMainSidePanel when the toggle button is clicked', () => {
    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    const root = render({ store });
    const onClick = root
      .find(`.${styles.mainSidePanel}`)
      .prop('onClick') as SidePanelProps['onClick'];
    onClick();

    expect(dispatch).toHaveBeenCalledWith(
      fullscreenGridActions.toggleMainSidePanel(),
    );
  });

  it('renders the alt side panel expanded by default', () => {
    const root = render();

    expect(root.find(`.${styles.altSidePanel}`)).toHaveProp('isExpanded', true);
  });

  it('renders a collapsed alt side panel', () => {
    const store = configureStore();
    store.dispatch(fullscreenGridActions.toggleAltSidePanel());

    const root = render({ store });

    expect(root.find(`.${styles.altSidePanel}`)).toHaveLength(1);
    expect(root.find(`.${styles.altSidePanel}`)).toHaveProp(
      'isExpanded',
      false,
    );
    expect(root.find(`.${styles.altSidePanel}`)).toHaveProp('toggleLeft', true);
  });

  it('dispatches toggleAltSidePanel when the toggle button is clicked', () => {
    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    const root = render({ store });

    const onClick = root
      .find(`.${styles.altSidePanel}`)
      .prop('onClick') as SidePanelProps['onClick'];
    onClick();

    expect(dispatch).toHaveBeenCalledWith(
      fullscreenGridActions.toggleAltSidePanel(),
    );
  });

  it('renders the main content panel with a location key', () => {
    const key = 'locationKey';
    const root = render({ location: createFakeLocation({ key }) });

    expect(root.find(`.${styles.content}`).key()).toEqual(key);
  });
});
