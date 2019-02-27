import * as React from 'react';
import {
  Decoration,
  Diff,
  DiffInfo,
  DiffProps,
  Hunk,
  HunkInfo,
  parseDiff,
} from 'react-diff-view';

import styles from './styles.module.scss';
import 'react-diff-view/style/index.css';

type Props = {
  diff: string;
  viewType: DiffProps['viewType'];
};

class DiffView extends React.Component<Props> {
  static defaultProps = {
    viewType: 'unified',
  };

  renderHeader({ hunks }: DiffInfo) {
    const { additions, deletions } = hunks.reduce(
      (acc, hunk) => {
        return {
          additions:
            acc.additions +
            hunk.changes.filter((change) => change.isInsert).length,
          deletions:
            acc.deletions +
            hunk.changes.filter((change) => change.isDelete).length,
        };
      },
      { additions: 0, deletions: 0 },
    );

    return (
      <div className={styles.header}>
        <div className={styles.stats}>
          <span className={styles.statsAdditions}>{`+++ ${additions}`}</span>
          <span className={styles.statsDeletions}>{`--- ${deletions}`}</span>
        </div>
      </div>
    );
  }

  renderHunk(hunk: HunkInfo, index: number) {
    const components = [
      <Hunk key={`hunk-${hunk.content}`} hunk={hunk} className={styles.hunk} />,
    ];

    // We don't want to display a separator above the first hunk because it
    // would add the separator between the diff header and the hunk.
    if (index > 0) {
      components.unshift(
        <Decoration key={`decoration-${hunk.content}`}>
          <div className={styles.hunkSeparator}>...</div>
        </Decoration>,
      );
    }

    return components;
  }

  renderHunks = (hunks: HunkInfo[]) => {
    return hunks.map(this.renderHunk);
  };

  render() {
    const { diff, viewType } = this.props;
    const files = parseDiff(diff);

    return (
      <div className={styles.DiffView}>
        {files.map((file) => {
          const { oldRevision, newRevision, hunks, type } = file;

          return (
            <React.Fragment key={`${oldRevision}-${newRevision}`}>
              {this.renderHeader(file)}

              <Diff
                className={styles.diff}
                diffType={type}
                hunks={hunks}
                viewType={viewType}
              >
                {/* Don't ask... https://github.com/otakustay/react-diff-view/blob/882f85adc46431f065a3458104e13f6233cdfcfd/src/Diff/__test__/Diff.test.jsx#L18 */}
                {this.renderHunks}
              </Diff>
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

export default DiffView;
