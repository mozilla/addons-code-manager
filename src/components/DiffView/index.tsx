/// <reference path="index.d.ts"/>

import * as React from 'react';
import { Diff, ViewType, parseDiff } from 'react-diff-view';
export interface Props {
  diff: string;
  viewType: ViewType;
}

const diffViewDefaultProps = {
  viewType: 'unified' as ViewType,
};

interface DiffViewSFC extends React.SFC<Props> {
  defaultProps: typeof diffViewDefaultProps;
}

const DiffView: DiffViewSFC = (props) => {
  const { diff, viewType } = props;
  const parsedDiff = parseDiff(diff)[0];

  return (
    <Diff
      viewType={viewType}
      diffType={parsedDiff.type}
      hunks={parsedDiff.hunks}
    />
  );
};

DiffView.defaultProps = diffViewDefaultProps;

export default DiffView;
