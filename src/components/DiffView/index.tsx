import * as React from 'react';
import {
  ChangeInfo,
  Decoration,
  Diff,
  DiffInfo,
  DiffProps,
  Hunk,
  Hunks,
  HunkInfo,
  getChangeKey,
  tokenize,
} from 'react-diff-view';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import makeClassName from 'classnames';

import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import LinterMessage from '../LinterMessage';
import refractor from '../../refractor';
import { Version } from '../../reducers/versions';
import { getLanguageFromMimeType, gettext } from '../../utils';
import styles from './styles.module.scss';
import 'react-diff-view/style/index.css';

export const getAllHunkChanges = (hunks: Hunks): ChangeInfo[] => {
  return hunks.reduce(
    (result: ChangeInfo[], { changes }) => [...result, ...changes],
    [],
  );
};

export type PublicProps = {
  diffs: DiffInfo[];
  mimeType: string;
  version: Version;
};

export type DefaultProps = {
  _document: typeof document;
  _tokenize: typeof tokenize;
  viewType: DiffProps['viewType'];
};

export type RouterProps = RouteComponentProps<{}>;

export type Props = PublicProps & DefaultProps & RouterProps;

export class DiffViewBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _document: document,
    _tokenize: tokenize,
    viewType: 'unified',
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

  getWidgets = (
    hunks: Hunks,
    selectedMessageMap: LinterProviderInfo['selectedMessageMap'],
  ) => {
    return getAllHunkChanges(hunks).reduce((widgets, change) => {
      const changeKey = getChangeKey(change);
      const line = change.lineNumber;

      let messages;
      if (line && selectedMessageMap) {
        messages = selectedMessageMap.byLine[line];
      }

      let widget = null;
      if (messages && messages.length) {
        widget = (
          <div className={styles.inlineLinterMessages}>
            {messages.map((msg) => {
              return <LinterMessage key={msg.uid} message={msg} inline />;
            })}
          </div>
        );
      }

      return { ...widgets, [changeKey]: widget };
    }, {});
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

  renderWithMessages = ({ selectedMessageMap }: LinterProviderInfo) => {
    const { _tokenize, diffs, mimeType, viewType, location } = this.props;

    const options = {
      highlight: true,
      language: getLanguageFromMimeType(mimeType),
      refractor,
    };

    const selectedChanges =
      // Remove the `#` if `location.hash` is defined
      location.hash.length > 2 ? [location.hash.substring(1)] : [];

    const globalLinterMessages = selectedMessageMap
      ? selectedMessageMap.global.map((message) => {
          return <LinterMessage key={message.uid} message={message} />;
        })
      : [];

    return (
      <div className={styles.DiffView}>
        {diffs.length === 0 && (
          <React.Fragment>
            <div className={styles.header} />
            <div className={makeClassName(styles.diff, styles.noDiffs)}>
              {gettext('No differences')}
            </div>
          </React.Fragment>
        )}

        {globalLinterMessages.length ? (
          <div className={styles.globalLinterMessages}>
            {globalLinterMessages}
          </div>
        ) : null}

        {diffs.map((diff) => {
          const { oldRevision, newRevision, hunks, type } = diff;

          return (
            <React.Fragment key={`${oldRevision}-${newRevision}`}>
              {this.renderHeader(diff)}

              <Diff
                className={styles.diff}
                diffType={type}
                hunks={hunks}
                tokens={_tokenize(hunks, options)}
                viewType={viewType}
                gutterType="anchor"
                generateAnchorID={getChangeKey}
                selectedChanges={selectedChanges}
                widgets={this.getWidgets(hunks, selectedMessageMap)}
              >
                {this.renderHunks}
              </Diff>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  render() {
    const { version } = this.props;

    return (
      <LinterProvider
        versionId={version.id}
        validationURL={version.validationURL}
        selectedPath={version.selectedPath}
      >
        {this.renderWithMessages}
      </LinterProvider>
    );
  }
}

export default withRouter(DiffViewBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
