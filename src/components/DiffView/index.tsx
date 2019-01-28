/// <reference path="index.d.ts"/>

import * as React from 'react';
import { Diff, DiffInfo, DiffProps, parseDiff } from 'react-diff-view';

type Props = {
  diff: string;
  viewType: DiffProps['viewType'];
};

class DiffView extends React.Component<Props> {
  static defaultProps = {
    viewType: 'unified',
  };

  render = () => {
    const { diff, viewType } = this.props;
    const files = parseDiff(diff);

    const renderFile = ({ hunks, type }: DiffInfo, index: number) => (
      <Diff diffType={type} hunks={hunks} key={index} viewType={viewType} />
    );

    return <div>{files.map(renderFile)}</div>;
  };
}

export default DiffView;
