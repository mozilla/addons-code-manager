/// <reference path="index.d.ts"/>

import * as React from 'react';
import { Diff, DiffProps, ViewType, parseDiff } from 'react-diff-view';

type Props = {
  diff: string;
  viewType: DiffProps['viewType'];
};

class DiffView extends React.Component<Props> {
  static defaultProps = {
    viewType: 'unified',
  };

  render = () => {
    const { diff, viewType } = this.props as Props;
    const parsedDiff = parseDiff(diff)[0];

    return (
      <Diff
        viewType={viewType}
        diffType={parsedDiff.type}
        hunks={parsedDiff.hunks}
      />
    );
  };
}

export default DiffView;
