import { shallow } from 'enzyme';
import React from 'react';
import { Diff, parseDiff } from 'react-diff-view';

import basicDiff from './fixtures/basicDiff';
import multipleDiff from './fixtures/multipleDiff';

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
    const root = shallow(<DiffView diff={basicDiff} />);

    expect(root.find(Diff)).toHaveProp('diffType', parsedDiff.type);
    expect(root.find(Diff)).toHaveProp('hunks', parsedDiff.hunks);
  });

  it('creates multiple Diff instances when there are multiple files in the diff', () => {
    const parsedDiff = parseDiff(multipleDiff);
    const root = shallow(<DiffView diff={multipleDiff} />);

    expect(root.find(Diff)).toHaveLength(parsedDiff.length);
    parsedDiff.forEach((diff, index) => {
      expect(root.find(Diff).at(index)).toHaveProp('diffType', diff.type);
      expect(root.find(Diff).at(index)).toHaveProp('hunks', diff.hunks);
    });
  });
});
