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
  RenderGutterParams,
  WidgetMap,
  getChangeKey,
  tokenize,
} from 'react-diff-view';
import { Alert } from 'react-bootstrap';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import makeClassName from 'classnames';

import Commentable from '../Commentable';
import CommentList from '../CommentList';
import FadableContent from '../FadableContent';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import LinterMessage from '../LinterMessage';
import GlobalLinterMessages from '../GlobalLinterMessages';
import SlowPageAlert from '../SlowPageAlert';
import {
  ScrollTarget,
  Version,
  changeTypes,
  getDiffAnchors,
  getRelativeDiffAnchor,
} from '../../reducers/versions';
import {
  SLOW_LOADING_CHAR_COUNT,
  TRIMMED_CHAR_COUNT,
  codeCanBeHighlighted,
  getAllHunkChanges,
  getLanguageFromMimeType,
  gettext,
  shouldAllowSlowPages,
} from '../../utils';
import worker from './workerShim';
import styles from './styles.module.scss';
import 'react-diff-view/style/index.css';

export const changeContentAddedByTrimmer =
  '/* diff truncated by code-manager */';

export const getChangeCharCount = (hunks: Hunks) => {
  const changes = getAllHunkChanges(hunks);
  return changes.reduce((charCount, change) => {
    return charCount + change.content.length;
  }, 0);
};

export const trimHunks = ({
  hunks,
  _trimmedCharCount = TRIMMED_CHAR_COUNT,
}: {
  hunks: Hunks;
  _trimmedCharCount?: number;
}): Hunks => {
  let charCount = 0;
  let hunkIndex = 0;
  const trimmedHunks: Hunks = [];
  for (const hunk of hunks) {
    trimmedHunks.push({ ...hunk, changes: [] });
    hunkIndex = trimmedHunks.length - 1;
    for (const change of hunk.changes) {
      charCount += change.content.length;
      if (charCount > _trimmedCharCount) {
        trimmedHunks[hunkIndex].changes.push({
          ...change,
          content: changeContentAddedByTrimmer,
        });
        return trimmedHunks;
      }
      trimmedHunks[hunkIndex].changes.push(change);
    }
  }
  return trimmedHunks;
};

export const changeCanBeCommentedUpon = (change: ChangeInfo) => {
  return [changeTypes.insert, changeTypes.normal].includes(change.type);
};

export type PublicProps = {
  diff: DiffInfo | null;
  mimeType: string;
  version: Version;
};

export type DefaultProps = {
  _changeCanBeCommentedUpon: typeof changeCanBeCommentedUpon;
  _codeCanBeHighlighted: typeof codeCanBeHighlighted;
  _document: typeof document;
  _getDiffAnchors: typeof getDiffAnchors;
  _getRelativeDiffAnchor: typeof getRelativeDiffAnchor;
  _slowLoadingCharCount: number;
  _tokenize: typeof tokenize;
  _trimmedCharCount: number;
  enableCommenting: boolean;
  viewType: DiffProps['viewType'];
};

export type RouterProps = RouteComponentProps<{}>;

export type Props = PublicProps & DefaultProps & RouterProps;

export class DiffViewBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _changeCanBeCommentedUpon: changeCanBeCommentedUpon,
    _codeCanBeHighlighted: codeCanBeHighlighted,
    _document: document,
    _getDiffAnchors: getDiffAnchors,
    _getRelativeDiffAnchor: getRelativeDiffAnchor,
    _slowLoadingCharCount: SLOW_LOADING_CHAR_COUNT,
    _tokenize: tokenize,
    _trimmedCharCount: TRIMMED_CHAR_COUNT,
    enableCommenting: process.env.REACT_APP_ENABLE_COMMENTING === 'true',
    viewType: 'unified',
  };

  workerInstance: any;

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

    console.log('---- in loadData');
    if (!this.workerInstance) {
      this.workerInstance = worker(); // Attach an event listener to receive calculations from your worker
      console.log('---- worker created: ', this.workerInstance);
    }

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
    const { _changeCanBeCommentedUpon, enableCommenting, version } = this.props;

    const allWidgets: WidgetMap = {};

    // We only want widgets for delete, insert and normal changes, not eofnl changes.
    const changesAllowingWidgets = getAllHunkChanges(hunks).filter(
      (change) => change.isDelete || change.isInsert || change.isNormal,
    );
    for (const change of changesAllowingWidgets) {
      const changeKey = getChangeKey(change);
      const line = change.lineNumber;

      let messages;
      if (line && selectedMessageMap) {
        messages = selectedMessageMap.byLine[line];
      }

      let widget =
        enableCommenting && line && _changeCanBeCommentedUpon(change) ? (
          <CommentList
            addonId={version.addon.id}
            fileName={version.selectedPath}
            line={line}
            versionId={version.id}
          >
            {(allComments) => allComments}
          </CommentList>
        ) : null;

      if (messages && messages.length) {
        widget = (
          <>
            {widget}
            <div className={styles.inlineLinterMessages}>
              {messages.map((msg) => {
                return <LinterMessage key={msg.uid} message={msg} inline />;
              })}
            </div>
          </>
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

  renderGutter = ({
    change,
    renderDefault,
    side,
    wrapInAnchor,
  }: RenderGutterParams) => {
    const { _changeCanBeCommentedUpon, enableCommenting, version } = this.props;

    const { lineNumber } = change;

    const defaultGutter = wrapInAnchor(renderDefault());
    let gutter = defaultGutter;
    if (
      enableCommenting &&
      _changeCanBeCommentedUpon(change) &&
      lineNumber &&
      side === 'new'
    ) {
      gutter = (
        <Commentable
          as="div"
          className={styles.gutter}
          line={lineNumber}
          fileName={version.selectedPath}
          versionId={version.id}
        >
          {(addCommentButton) => (
            <>
              {defaultGutter}
              <span className={styles.commentButton}>{addCommentButton}</span>
            </>
          )}
        </Commentable>
      );
    }

    return gutter;
  };

  renderWithMessages = ({ selectedMessageMap }: LinterProviderInfo) => {
    const {
      _codeCanBeHighlighted,
      _slowLoadingCharCount,
      _trimmedCharCount,
      diff,
      mimeType,
      viewType,
      location,
    } = this.props;

    const options = {
      highlight: true,
      language: getLanguageFromMimeType(mimeType),
    };

    const selectedChanges =
      // Remove the `#` if `location.hash` is defined
      location.hash.length > 2 ? [location.hash.substring(1)] : [];

    const extraMessages = [];

    let hunksToDisplay;
    let diffWasTrimmed = false;
    let diffIsSlowAlert;

    if (diff) {
      hunksToDisplay = diff.hunks;

      if (getChangeCharCount(hunksToDisplay) >= _slowLoadingCharCount) {
        if (!shouldAllowSlowPages({ allowByDefault: true, location })) {
          hunksToDisplay = trimHunks({
            _trimmedCharCount,
            hunks: hunksToDisplay,
          });
          diffWasTrimmed = true;
        }
        diffIsSlowAlert = (
          <SlowPageAlert
            allowSlowPagesByDefault
            key="slowPageAlert"
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

    let tokens;
    let tokenPromise;

    // Create an instance of your worker
    const workerInstance = worker(); // Attach an event listener to receive calculations from your worker
    workerInstance.onmessage = (message: { data: { type?: string } }) => {
      console.log('New Message: ', message);
      // data.type indicates an automatically generated message from the worker.
      // We just want to respond to our custom message.
      if (!message.data.type) {
        console.log('Custome message: ', message.data);
      }
    };
    // workerInstance.addEventListener(
    //   'message',
    //   (message: { data: { type: string; result?: object } }) => {
    //     console.log('New Message, message: ', message);
    //     if (message.data.type)
    //       console.log('New Message, message.data.id: ', message.data.id);
    //   },
    // );

    if (
      !tokenPromise &&
      hunksToDisplay &&
      _codeCanBeHighlighted({ code: getAllHunkChanges(hunksToDisplay) })
    ) {
      // TODO: always highlight when we can use a Web Worker.
      // https://github.com/mozilla/addons-code-manager/issues/928
      console.log(
        '----- About to call doTokenize with hunksToDisplay: ',
        hunksToDisplay,
      );
      console.log('----- About to call doTokenize with options: ', options);
      tokenPromise = workerInstance.doTokenize(hunksToDisplay, options);
      console.log('----- doTokenize done: ', tokenPromise);

      // tokens = _tokenize(hunksToDisplay, options);
    }

    if (diff && !tokens) {
      extraMessages.push(
        <Alert key="syntaxHighlightingAlert" variant="warning">
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

        {diff && hunksToDisplay && (
          <React.Fragment key={`${diff.oldRevision}-${diff.newRevision}`}>
            {this.renderHeader(diff)}
            <FadableContent fade={diffWasTrimmed}>
              <Diff
                className={styles.diff}
                diffType={diff.type}
                hunks={hunksToDisplay}
                tokens={tokens}
                viewType={viewType}
                gutterType="anchor"
                generateAnchorID={getChangeKey}
                selectedChanges={selectedChanges}
                widgets={this.getWidgets(hunksToDisplay, selectedMessageMap)}
                renderGutter={this.renderGutter}
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
