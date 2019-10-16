import queryString from 'query-string';
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
  WidgetMap,
  getChangeKey,
  tokenize,
} from 'react-diff-view';
import { Alert } from 'react-bootstrap';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import makeClassName from 'classnames';

import FadableContent from '../FadableContent';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import LinterMessage from '../LinterMessage';
import GlobalLinterMessages from '../GlobalLinterMessages';
import SlowPageAlert from '../SlowPageAlert';
import refractor from '../../refractor';
import {
  ScrollTarget,
  Version,
  getDiffAnchors,
  getRelativeDiffAnchor,
} from '../../reducers/versions';
import {
  getLanguageFromMimeType,
  gettext,
  shouldAllowSlowPages,
} from '../../utils';
import styles from './styles.module.scss';
import 'react-diff-view/style/index.css';

// This is the number of changes for which a diff starts loading slowly,
// even when syntax highlighting is disabled.
const SLOW_DIFF_CHANGE_COUNT = 1000;

export const getAllHunkChanges = (hunks: Hunks): ChangeInfo[] => {
  return hunks.reduce(
    (result: ChangeInfo[], { changes }) => [...result, ...changes],
    [],
  );
};

export const diffCanBeHighlighted = (
  diff: DiffInfo,
  {
    // This is a single line width that would make a diff too wide.
    wideLineLength = 700,
    // This is the total line count of a diff we consider too long.
    highLineCount = 3000,
  } = {},
) => {
  const allChanges = getAllHunkChanges(diff.hunks);

  for (let index = 0; index < allChanges.length; index++) {
    const change = allChanges[index];
    if (change.content.length > wideLineLength) {
      return false;
    }
    if (index >= highLineCount) {
      return false;
    }
  }

  return true;
};

export const trimHunkChanges = (
  hunks: Hunks,
  { maxLength = SLOW_DIFF_CHANGE_COUNT } = {},
): Hunks => {
  let lengthSoFar = 0;
  const trimmed = [];

  for (const hunk of hunks) {
    const length = maxLength - lengthSoFar;
    if (length > 0) {
      trimmed.push({
        ...hunk,
        changes: hunk.changes.slice(0, length),
      });
    }

    lengthSoFar += hunk.changes.length;
  }

  return trimmed;
};

export type PublicProps = {
  diff: DiffInfo | null;
  mimeType: string;
  selectedPath: string;
  version: Version;
};

export type DefaultProps = {
  _diffCanBeHighlighted: typeof diffCanBeHighlighted;
  _document: typeof document;
  _getDiffAnchors: typeof getDiffAnchors;
  _getRelativeDiffAnchor: typeof getRelativeDiffAnchor;
  _slowDiffChangeCount: number;
  _tokenize: typeof tokenize;
  viewType: DiffProps['viewType'];
};

export type RouterProps = RouteComponentProps<{}>;

export type Props = PublicProps & DefaultProps & RouterProps;

export class DiffViewBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _diffCanBeHighlighted: diffCanBeHighlighted,
    _document: document,
    _getDiffAnchors: getDiffAnchors,
    _getRelativeDiffAnchor: getRelativeDiffAnchor,
    _slowDiffChangeCount: SLOW_DIFF_CHANGE_COUNT,
    _tokenize: tokenize,
    viewType: 'unified',
  };

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate() {
    this.loadData();
  }

  loadData() {
    const {
      _document,
      _getDiffAnchors,
      _getRelativeDiffAnchor,
      diff,
      history,
      location,
    } = this.props;

    if (diff) {
      const queryParams = queryString.parse(location.search);
      const { scrollTo } = queryParams;
      let anchor;
      if (scrollTo) {
        if (scrollTo === ScrollTarget.firstDiff) {
          anchor = _getRelativeDiffAnchor({ diff });
        } else {
          const anchors = _getDiffAnchors(diff);
          if (anchors.length) {
            anchor = anchors[anchors.length - 1];
          }
        }
        if (anchor) {
          const newParams = { ...queryParams };

          delete newParams.scrollTo;
          const newLocation = {
            ...location,
            hash: `#${anchor}`,
            search: queryString.stringify(newParams),
          };

          history.push(newLocation);
        }
      }
    }

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
    const allWidgets: WidgetMap = {};

    for (const change of getAllHunkChanges(hunks)) {
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

      allWidgets[changeKey] = widget;
    }

    return allWidgets;
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

  renderExtraMessages = (messages: React.ReactNode) => {
    return <div className={styles.extraMessages}>{messages}</div>;
  };

  renderWithMessages = ({ selectedMessageMap }: LinterProviderInfo) => {
    const {
      _diffCanBeHighlighted,
      _slowDiffChangeCount,
      _tokenize,
      diff,
      mimeType,
      viewType,
      location,
    } = this.props;

    const options = {
      highlight: true,
      language: getLanguageFromMimeType(mimeType),
      refractor,
    };

    const selectedChanges =
      // Remove the `#` if `location.hash` is defined
      location.hash.length > 2 ? [location.hash.substring(1)] : [];

    let tokens;
    if (diff && _diffCanBeHighlighted(diff)) {
      // TODO: always highlight when we can use a Web Worker.
      // https://github.com/mozilla/addons-code-manager/issues/928
      tokens = _tokenize(diff.hunks, options);
    }

    const extraMessages = [];

    let hunks;
    let diffWasTrimmed = false;
    let diffIsSlowAlert;

    if (diff) {
      let changeCount = 0;
      hunks = diff.hunks.map((hunk) => {
        changeCount += hunk.changes.length;
        return hunk;
      });

      if (changeCount >= _slowDiffChangeCount) {
        if (!shouldAllowSlowPages(location)) {
          hunks = trimHunkChanges(hunks, { maxLength: _slowDiffChangeCount });
          diffWasTrimmed = true;
        }
        diffIsSlowAlert = (
          <SlowPageAlert
            location={location}
            getMessage={(allowSlowPages: boolean) => {
              return allowSlowPages
                ? gettext('This diff will load slowly.')
                : gettext('This diff was shortened to load faster.');
            }}
            getLinkText={(allowSlowPages: boolean) => {
              return allowSlowPages
                ? gettext('Shorten the diff.')
                : gettext('Show the original diff.');
            }}
          />
        );
        extraMessages.push(diffIsSlowAlert);
      }
    }

    if (diff && !tokens) {
      extraMessages.push(
        <Alert variant="warning">
          {gettext('Syntax highlighting was disabled for performance')}
        </Alert>,
      );
    }

    return (
      <div className={styles.DiffView}>
        {!diff && (
          <>
            <div className={styles.header} />
            <div className={makeClassName(styles.diff, styles.noDiffs)}>
              {gettext('No differences')}
            </div>
          </>
        )}

        <GlobalLinterMessages
          className={styles.globalLinterMessages}
          messages={selectedMessageMap && selectedMessageMap.global}
        />

        {extraMessages.length ? this.renderExtraMessages(extraMessages) : null}

        {diff && hunks && (
          <React.Fragment key={`${diff.oldRevision}-${diff.newRevision}`}>
            {this.renderHeader(diff)}
            <FadableContent fade={diffWasTrimmed}>
              <Diff
                className={styles.diff}
                diffType={diff.type}
                hunks={hunks}
                tokens={tokens}
                viewType={viewType}
                gutterType="anchor"
                generateAnchorID={getChangeKey}
                selectedChanges={selectedChanges}
                widgets={this.getWidgets(hunks, selectedMessageMap)}
              >
                {this.renderHunks}
              </Diff>
            </FadableContent>
          </React.Fragment>
        )}

        {/* Only show a slow alert at the bottom if the diff was trimmed */}
        {diffWasTrimmed &&
          diffIsSlowAlert &&
          this.renderExtraMessages(diffIsSlowAlert)}
      </div>
    );
  };

  render() {
    const { selectedPath, version } = this.props;

    return (
      <LinterProvider
        versionId={version.id}
        validationURL={version.validationURL}
        selectedPath={selectedPath}
      >
        {this.renderWithMessages}
      </LinterProvider>
    );
  }
}

export default withRouter(DiffViewBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
