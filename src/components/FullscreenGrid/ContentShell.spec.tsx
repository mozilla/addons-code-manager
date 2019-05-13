import * as React from 'react';
import { Store } from 'redux';

import configureStore from '../../configureStore';
import { actions as fullscreenGridActions } from '../../reducers/fullscreenGrid';
import { spyOn, shallowUntilTarget } from '../../test-helpers';
import ContentShell, { ContentShellBase, PublicProps } from './ContentShell';
import styles from './styles.module.scss';

describe(__filename, () => {
  type RenderParams = PublicProps & { store?: Store };

  const render = ({
    store = configureStore(),
    ...props
  }: RenderParams = {}) => {
    return shallowUntilTarget(<ContentShell {...props} />, ContentShellBase, {
      shallowOptions: { context: { store } },
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

  it('renders a mainSidePanel', () => {
    const childClass = 'ChildExample';

    const root = render({ mainSidePanel: <div className={childClass} /> });

    const mainSidePanelContent = root.find(`.${styles.mainSidePanelContent}`);
    expect(mainSidePanelContent).toHaveLength(1);
    // The `mainSidePanel` is placed into a `<div />` as there is a button
    // below to collapse it.
    expect(mainSidePanelContent.find(`.${childClass}`)).toHaveLength(1);
  });

  it('accepts a mainSidePanelClass', () => {
    const customClass = 'Example';

    const root = render({ mainSidePanelClass: customClass });

    expect(root.find(`.${customClass}`)).toHaveLength(1);
  });

  it('renders an altSidePanel', () => {
    const childClass = 'ChildExample';

    const root = render({ altSidePanel: <div className={childClass} /> });

    expect(root.find(`.${childClass}`)).toHaveLength(1);
  });

  it('accepts an altSidePanelClass', () => {
    const customClass = 'Example';

    const root = render({ altSidePanelClass: customClass });

    expect(root.find(`.${customClass}`)).toHaveLength(1);
  });

  it('renders the main side panel expanded by default', () => {
    const root = render();

    expect(root.find(`.${styles.mainSidePanel}`)).toHaveProp(
      'aria-expanded',
      'true',
    );
    expect(root.find(`.${styles.mainSidePanelIsCollapsed}`)).toHaveLength(0);
  });

  it('renders a ToggleButton for the main side panel', () => {
    const root = render();

    expect(root.find(`.${styles.mainSidePanelToggleButton}`)).toHaveLength(1);
    expect(root.find(`.${styles.mainSidePanelToggleButton}`)).toHaveProp(
      'label',
      'Collapse this panel',
    );
    expect(root.find(`.${styles.mainSidePanelToggleButton}`)).toHaveProp(
      'title',
      'Collapse this panel',
    );
    expect(root.find(`.${styles.mainSidePanelToggleButton}`)).toHaveProp(
      'toggleLeft',
      true,
    );
  });

  it('renders a collapsed main side panel', () => {
    const store = configureStore();
    store.dispatch(fullscreenGridActions.toggleMainSidePanel());

    const root = render({ store });

    expect(root.find(`.${styles.mainSidePanel}`)).toHaveProp(
      'aria-expanded',
      'false',
    );
    expect(root.find(`.${styles.mainSidePanelIsCollapsed}`)).toHaveLength(1);

    expect(root.find(`.${styles.mainSidePanelToggleButton}`)).toHaveLength(1);
    expect(root.find(`.${styles.mainSidePanelToggleButton}`)).toHaveProp(
      'label',
      null,
    );
    expect(root.find(`.${styles.mainSidePanelToggleButton}`)).toHaveProp(
      'title',
      'Expand this panel',
    );
    expect(root.find(`.${styles.mainSidePanelToggleButton}`)).toHaveProp(
      'toggleLeft',
      false,
    );
  });

  it('dispatches toggleMainSidePanel when the toggle button is clicked', () => {
    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    const root = render({ store });
    root.find(`.${styles.mainSidePanelToggleButton}`).simulate('click');

    expect(dispatch).toHaveBeenCalledWith(
      fullscreenGridActions.toggleMainSidePanel(),
    );
  });

  it('renders the alt side panel expanded by default', () => {
    const root = render();

    expect(root.find(`.${styles.altSidePanel}`)).toHaveProp(
      'aria-expanded',
      'true',
    );
    expect(root.find(`.${styles.altSidePanelIsCollapsed}`)).toHaveLength(0);
  });

  it('renders a ToggleButton for the alt side panel', () => {
    const root = render();

    expect(root.find(`.${styles.altSidePanelToggleButton}`)).toHaveLength(1);
    expect(root.find(`.${styles.altSidePanelToggleButton}`)).toHaveProp(
      'label',
      'Collapse',
    );
    expect(root.find(`.${styles.altSidePanelToggleButton}`)).toHaveProp(
      'title',
      'Collapse this panel',
    );
    expect(root.find(`.${styles.altSidePanelToggleButton}`)).toHaveProp(
      'toggleLeft',
      false,
    );
  });

  it('renders a collapsed alt side panel', () => {
    const store = configureStore();
    store.dispatch(fullscreenGridActions.toggleAltSidePanel());

    const root = render({ store });

    expect(root.find(`.${styles.altSidePanel}`)).toHaveProp(
      'aria-expanded',
      'false',
    );
    expect(root.find(`.${styles.altSidePanelIsCollapsed}`)).toHaveLength(1);

    expect(root.find(`.${styles.altSidePanelToggleButton}`)).toHaveLength(1);
    expect(root.find(`.${styles.altSidePanelToggleButton}`)).toHaveProp(
      'label',
      null,
    );
    expect(root.find(`.${styles.altSidePanelToggleButton}`)).toHaveProp(
      'title',
      'Expand this panel',
    );
    expect(root.find(`.${styles.altSidePanelToggleButton}`)).toHaveProp(
      'toggleLeft',
      true,
    );
  });

  it('dispatches toggleAltSidePanel when the toggle button is clicked', () => {
    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');

    const root = render({ store });
    root.find(`.${styles.altSidePanelToggleButton}`).simulate('click');

    expect(dispatch).toHaveBeenCalledWith(
      fullscreenGridActions.toggleAltSidePanel(),
    );
  });
});
