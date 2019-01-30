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

  const multipleDiff = `diff --git a/src/index1.js b/src/index1.js
index e69de29..d00491f 100644
--- a/src/index1.js
+++ b/src/index1.js
@@ -0,0 +1 @@
+1
diff --git a/src/index.js b/src/index2.js
index d00491f..0cfbf08 100644
--- a/src/index2.js
+++ b/src/index2.js
@@ -1 +1 @@
-1
+2
diff --git a/src/index3.js b/src/index3.js
index 0cfbf08..e69de29 100644
--- a/src/index3.js
+++ b/src/index3.js
@@ -1 +0,0 @@
-2`;

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
