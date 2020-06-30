import * as React from 'react';
import { Store } from 'redux';
import { Link } from 'react-router-dom';

import {
  createFakeEvent,
  createFakeLogger,
  getInstance,
  spyOn,
  shallowUntilTarget,
} from '../../test-helpers';
import styles from './styles.module.scss';
import configureStore from '../../configureStore';
import { actions as versionsActions } from '../../reducers/versions';

import Index, { IndexBase, PublicProps, DefaultProps } from '.';

describe(__filename, () => {
  type RenderParams = { store?: Store } & Partial<PublicProps> &
    Partial<DefaultProps>;

  const render = ({
    store = configureStore(),
    ...moreProps
  }: RenderParams = {}) => {
    return shallowUntilTarget(<Index {...moreProps} />, IndexBase, {
      shallowOptions: { context: { store } },
    });
  };

  it('renders a page with some links', () => {
    const root = render();

    expect(root.find('a')).toExist();
    expect(root.find(Link)).not.toExist();
  });

  it('renders some example links for local dev', () => {
    const root = render({ showLocalDevLinks: true });

    expect(root.find(Link)).toExist();
  });

  it('shows error simulation buttons', () => {
    const root = render({ allowErrorSimulation: true });

    expect(root.find(`.${styles.errorSimulationButtons}`)).toHaveLength(1);
  });

  it('hides error simulation buttons', () => {
    const root = render({ allowErrorSimulation: false });

    expect(root.find(`.${styles.errorSimulationButtons}`)).toHaveLength(0);
  });

  it('throws a simulated error', () => {
    const root = render({ allowErrorSimulation: true });

    const button = root.find(`.${styles.throwAnErrorButton}`);

    expect(() => button.simulate('click', createFakeEvent())).toThrow(
      /simulation of a thrown error/,
    );
  });

  it('will not throw an error when simulation is not allowed', () => {
    expect(() => {
      const root = render({ allowErrorSimulation: false });

      getInstance<IndexBase>(root).throwAnError();
    }).not.toThrow();
  });

  it('logs a simulated error', () => {
    const _log = createFakeLogger();
    const root = render({ allowErrorSimulation: true, _log });

    root.find(`.${styles.logAnErrorButton}`).simulate('click');

    expect(_log.error).toHaveBeenCalled();
  });

  it('logs a simulated error with console', () => {
    expect(() => {
      const root = render({ allowErrorSimulation: true });

      // Make sure this doesn't throw an error.
      root.find(`.${styles.logAnErrorWithConsoleButton}`).simulate('click');
    }).not.toThrow();
  });

  it('will not log an error when simulation is not allowed', () => {
    const _log = createFakeLogger();
    const root = render({ allowErrorSimulation: false, _log });

    getInstance<IndexBase>(root).logAnError();

    expect(_log.error).not.toHaveBeenCalled();
  });

  it('renders an HTML title', () => {
    const store = configureStore();
    const root = render({ store });

    expect(root.find('title')).toHaveText('Addons Code Manager');
  });

  it('dispatches actions to unset current versions', () => {
    const store = configureStore();
    const dispatch = spyOn(store, 'dispatch');
    render({ store });

    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.unsetCurrentVersionId(),
    );
    expect(dispatch).toHaveBeenCalledWith(
      versionsActions.unsetCurrentBaseVersionId(),
    );
  });
});
