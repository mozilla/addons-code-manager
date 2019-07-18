import { shallow } from 'enzyme';
import * as React from 'react';

import styles from './styles.module.scss';

import FadableContent, { PublicProps } from '.';

describe(__filename, () => {
  const render = (props: PublicProps) => {
    return shallow(<FadableContent {...props} />);
  };

  it('returns children without a shell when fade=false', () => {
    const exampleClass = 'example';
    const root = render({
      fade: false,
      children: <div className={exampleClass} />,
    });

    expect(root.find(`.${exampleClass}`)).toHaveLength(1);
    expect(root.find(`.${styles.shell}`)).toHaveLength(0);
  });

  it('returns children in a shell when fade=true', () => {
    const exampleClass = 'example';
    const root = render({
      fade: true,
      children: <div className={exampleClass} />,
    });

    const shell = root.find(`.${styles.shell}`);
    expect(shell).toHaveLength(1);
    expect(shell.find(`.${exampleClass}`)).toHaveLength(1);
  });
});
