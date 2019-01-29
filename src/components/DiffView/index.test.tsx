/// <reference path="index.d.ts"/>

import { shallow } from 'enzyme';
import React from 'react';
import { Diff, parseDiff } from 'react-diff-view';

import DiffView from '.';

describe(__filename, () => {
  const basicDiff = `diff --git a/src/components/DiffView.test.tsx b/src/components/DiffView.test.tsx
index 5ca1a30..4e2c90f 100644
--- a/src/components/DiffView.test.tsx
+++ b/src/components/DiffView.test.tsx
@@ -35,6 +35,8 @@ it('defaults the viewType to unified', () => {
 it('renders with a specified viewType', () => {
   const viewType = 'split';
   const root = render({ viewType });
+
+  expect(root).toHaveProp('viewType', viewType);
 });`;

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
});
