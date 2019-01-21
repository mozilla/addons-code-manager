/// <reference path="DiffView.d.ts"/>

import * as React from 'react';
import { Diff, Hunk, parseDiff } from 'react-diff-view';

export interface Props {
  diff: string;
  viewType: 'split' | 'unified';
}

export default class DiffView extends React.Component<Props> {
  static defaultProps = {
    viewType: 'unified',
  };

  render() {
    const { diff, viewType } = this.props;

    const parsedDiff = parseDiff(diff)[0];

    return (
      <Diff
        viewType={viewType}
        diffType={parsedDiff.type}
        hunks={parsedDiff.hunks}
      />
    );
  }
}
