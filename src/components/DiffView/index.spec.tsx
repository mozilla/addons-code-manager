import { shallow } from 'enzyme';
import React from 'react';
import { Diff, parseDiff } from 'react-diff-view';

import basicDiff from './fixtures/basicDiff';
import multipleDiff from './fixtures/multipleDiff';
import diffWithDeletions from './fixtures/diffWithDeletions';
import styles from './styles.module.scss';

import DiffView from '.';

describe(__filename, () => {
  const render = (props = {}) => {
    return shallow(<DiffView diff={basicDiff} {...props} />);
  };

  it('defaults the viewType to unified', () => {
    const root = render();

    expect(root.find(Diff)).toHaveProp('viewType', 'unified');
  });

  it('renders with a specified viewType', () => {
    const viewType = 'split';
    const root = render({ viewType });

    expect(root.find(Diff)).toHaveProp('viewType', viewType);
  });

  it('passes parsed diff information to DiffView', () => {
    const parsedDiff = parseDiff(basicDiff)[0];
    const root = render({ diff: basicDiff });

    expect(root.find(Diff)).toHaveProp('diffType', parsedDiff.type);
    expect(root.find(Diff)).toHaveProp('hunks', parsedDiff.hunks);
  });

  it('creates multiple Diff instances when there are multiple files in the diff', () => {
    const parsedDiff = parseDiff(multipleDiff);
    const root = render({ diff: multipleDiff });

    expect(root.find(Diff)).toHaveLength(parsedDiff.length);
    parsedDiff.forEach((diff, index) => {
      expect(root.find(Diff).at(index)).toHaveProp('diffType', diff.type);
      expect(root.find(Diff).at(index)).toHaveProp('hunks', diff.hunks);
    });
  });

  it('renders a header with diff stats', () => {
    const root = render();

    expect(root.find(`.${styles.header}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toIncludeText('+++ 2--- 0');
  });

  it('renders a header with diff stats for multiple hunks', () => {
    const root = render({ diff: diffWithDeletions });

    expect(root.find(`.${styles.header}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toHaveLength(1);
    expect(root.find(`.${styles.stats}`)).toIncludeText('+++ 24--- 4');
  });

  it('renders hunks with separators', () => {
    const parsedDiff = parseDiff(diffWithDeletions)[0];
    const root = render({ diff: diffWithDeletions });

    // Simulate the interface of <Diff />
    const children = root.find(Diff).prop('children');
    const diff = shallow(<div>{children(parsedDiff.hunks)}</div>);

    expect(diff.find(`.${styles.hunk}`)).toHaveLength(parsedDiff.hunks.length);
    expect(diff.find(`.${styles.hunkSeparator}`)).toHaveLength(
      // There are less separators than hunks.
      parsedDiff.hunks.length - 1,
    );
  });
});
