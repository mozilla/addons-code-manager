import * as React from 'react';
import { Diff, DiffProps, parseDiff } from 'react-diff-view';

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

    return (
      <div>
        {files.map(({ hunks, type }, index: number) => (
          <Diff
            diffType={type}
            hunks={hunks}
            // eslint-disable-next-line react/no-array-index-key
            key={`diff-${index}`}
            viewType={viewType}
          />
        ))}
      </div>
    );
  };
}

export default DiffView;
