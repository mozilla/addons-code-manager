import * as React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';

import { createFakeEvent, createFakeLogger } from '../../test-helpers';
import styles from './styles.module.scss';

import Index from '.';

describe(__filename, () => {
  it('renders a page with some links', () => {
    const root = shallow(<Index />);

    expect(root.find('a')).toExist();
    expect(root.find(Link)).not.toExist();
  });

  it('renders some example links for local dev', () => {
    const root = shallow(<Index showLocalDevLinks />);

    expect(root.find(Link)).toExist();
  });

  it('shows error simulation buttons', () => {
    const root = shallow(<Index allowErrorSimulation />);

    expect(root.find(`.${styles.errorSimulationButtons}`)).toHaveLength(1);
  });

  it('hides error simulation buttons', () => {
    const root = shallow(<Index allowErrorSimulation={false} />);

    expect(root.find(`.${styles.errorSimulationButtons}`)).toHaveLength(0);
  });

  it('throws a simulated error', () => {
    const root = shallow(<Index allowErrorSimulation />);

    const button = root.find(`.${styles.throwAnErrorButton}`);

    expect(() => button.simulate('click', createFakeEvent())).toThrow(
      /simulation of a thrown error/,
    );
  });

  it('will not throw an error when simulation is not allowed', () => {
    const root = shallow(<Index allowErrorSimulation={false} />);

    (root.instance() as Index).throwAnError();
  });

  it('logs a simulated error', () => {
    const _log = createFakeLogger();
    const root = shallow(<Index allowErrorSimulation _log={_log} />);

    root.find(`.${styles.logAnErrorButton}`).simulate('click');

    expect(_log.error).toHaveBeenCalled();
  });

  it('logs a simulated error with console', () => {
    const root = shallow(<Index allowErrorSimulation />);

    // Make sure this doesn't throw an error.
    root.find(`.${styles.logAnErrorWithConsoleButton}`).simulate('click');
  });

  it('will not log an error when simulation is not allowed', () => {
    const _log = createFakeLogger();
    const root = shallow(<Index allowErrorSimulation={false} _log={_log} />);

    (root.instance() as Index).logAnError();

    expect(_log.error).not.toHaveBeenCalled();
  });

  it('renders an HTML title', () => {
    const root = shallow(<Index />);

    expect(root.find('title')).toHaveText('Addons Code Manager');
  });
});
