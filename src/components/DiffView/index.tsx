import * as React from 'react';
import {
  Decoration,
  Diff,
  DiffInfo,
  DiffProps,
  Hunk,
  HunkInfo,
  getChangeKey,
  parseDiff,
  tokenize,
} from 'react-diff-view';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import refractor from '../../refractor';
import { getLanguageFromMimeType } from '../../utils';
import styles from './styles.module.scss';
import 'react-diff-view/style/index.css';

export type PublicProps = {
  _document: typeof document;
  _tokenize: typeof tokenize;
  diff: string;
  mimeType: string;
  viewType: DiffProps['viewType'];
};

type Props = PublicProps & RouteComponentProps;

export class DiffViewBase extends React.Component<Props> {
  static defaultProps = {
    _document: document,
    _tokenize: tokenize,
    viewType: 'unified' as PublicProps['viewType'],
  };

  componentDidMount() {
    const { _document, location } = this.props;

    if (!location.hash.length) {
      return;
    }

    const element = _document.querySelector(location.hash);

    if (element) {
      element.scrollIntoView();
    }
  }

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

  renderHunk = (hunk: HunkInfo, index: number) => {
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
  };

  renderHunks = (hunks: HunkInfo[]) => {
    return hunks.map(this.renderHunk);
  };

  render() {
    const { _tokenize, diff, mimeType, viewType, location } = this.props;

    const files = parseDiff(diff);
    const options = {
      highlight: true,
      language: getLanguageFromMimeType(mimeType),
      refractor,
    };

    const selectedChanges =
      // Remove the `#` if `location.hash` is defined
      location.hash.length > 2 ? [location.hash.substring(1)] : undefined;

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
                tokens={_tokenize(hunks, options)}
                viewType={viewType}
                gutterType="anchor"
                generateAnchorID={getChangeKey}
                selectedChanges={selectedChanges}
              >
                {this.renderHunks}
              </Diff>
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

// TODO: I can't make it work, I don't understand what's going on between
// public, default and router props. TS gets confused by `withRouter` HOC.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default withRouter(DiffViewBase) as any;
