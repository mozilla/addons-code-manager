import * as React from 'react';
import { withRouter, Link, RouteComponentProps } from 'react-router-dom';
import makeClassName from 'classnames';

import styles from './styles.module.scss';
import Commentable from '../Commentable';
import CommentList from '../CommentList';
import FadableContent from '../FadableContent';
import LinterMessage from '../LinterMessage';
import {
  getCodeLineAnchor,
  getCodeLineAnchorID,
  getLines,
  mapWithDepth,
} from './utils';
import refractor from '../../refractor';
import {
  gettext,
  getLanguageFromMimeType,
  shouldAllowSlowPages,
} from '../../utils';
import { Version } from '../../reducers/versions';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import GlobalLinterMessages from '../GlobalLinterMessages';
import SlowPageAlert from '../SlowPageAlert';

// This is how many lines of code it takes to slow down the UI.
const SLOW_LOADING_LINE_COUNT = 500;

// This function mimics what https://github.com/rexxars/react-refractor does,
// but we need a different layout to inline comments so we cannot use this
// component.
const renderHighlightedCode = (code: string, language: string) => {
  const ast = refractor.highlight(code, language);
  const value = ast.length === 0 ? code : ast.map(mapWithDepth(0));

  return (
    <pre className={styles.highlightedCode}>
      <code className={`language-${language}`}>{value}</code>
    </pre>
  );
};

const isLineSelected = (
  id: string,
  location: RouteComponentProps['location'],
) => {
  return `#${id}` === location.hash;
};

export const scrollToSelectedLine = (element: HTMLElement | null) => {
  if (element) {
    element.scrollIntoView();
  }
};

export type PublicProps = {
  mimeType: string;
  content: string;
  selectedPath: string;
  version: Version;
};

export type DefaultProps = {
  _scrollToSelectedLine: typeof scrollToSelectedLine;
  _slowLoadingLineCount: number;
  enableCommenting: boolean;
};

type Props = PublicProps & DefaultProps & RouteComponentProps;

export class CodeViewBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _scrollToSelectedLine: scrollToSelectedLine,
    _slowLoadingLineCount: SLOW_LOADING_LINE_COUNT,
    enableCommenting: process.env.REACT_APP_ENABLE_COMMENTING === 'true',
  };

  renderWithLinterInfo = ({ selectedMessageMap }: LinterProviderInfo) => {
    const {
      _scrollToSelectedLine,
      _slowLoadingLineCount,
      content,
      enableCommenting,
      location,
      mimeType,
      selectedPath,
      version,
    } = this.props;

    const language = getLanguageFromMimeType(mimeType);
    let codeLines = getLines(content);
    let codeWasTrimmed = false;
    let slowAlert;

    if (codeLines.length >= _slowLoadingLineCount) {
      if (!shouldAllowSlowPages(location)) {
        codeLines = codeLines.slice(0, _slowLoadingLineCount);
        codeWasTrimmed = true;
      }
      slowAlert = (
        <SlowPageAlert
          location={location}
          getMessage={(allowSlowPages: boolean) => {
            return allowSlowPages
              ? gettext('This file is loading slowly.')
              : gettext('This file has been shortened to load faster.');
          }}
          getLinkText={(allowSlowPages: boolean) => {
            return allowSlowPages
              ? gettext('View a shortened file.')
              : gettext('View the original file.');
          }}
        />
      );
    }

    return (
      <>
        <GlobalLinterMessages
          containerRef={
            isLineSelected(getCodeLineAnchorID(0), location)
              ? _scrollToSelectedLine
              : undefined
          }
          messages={selectedMessageMap && selectedMessageMap.global}
        />

        {slowAlert}

        <FadableContent fade={codeWasTrimmed}>
          <div className={styles.CodeView}>
            <table className={styles.table}>
              <tbody className={styles.tableBody}>
                {codeLines.map((code, i) => {
                  const line = i + 1;
                  const id = getCodeLineAnchorID(line);

                  let className = styles.line;
                  let shellRef;

                  if (isLineSelected(id, location)) {
                    className = makeClassName(className, styles.selectedLine);
                    shellRef = _scrollToSelectedLine;
                  }

                  return (
                    <React.Fragment key={`fragment-${line}`}>
                      <Commentable
                        as="tr"
                        id={id}
                        className={className}
                        line={line}
                        fileName={selectedPath}
                        shellRef={shellRef}
                        versionId={version.id}
                      >
                        {(addCommentButton) => (
                          <>
                            <td className={styles.lineNumber}>
                              <Link
                                className={styles.lineNumberLink}
                                to={{
                                  ...location,
                                  hash: getCodeLineAnchor(line),
                                }}
                              >{`${line}`}</Link>
                              {enableCommenting && addCommentButton}
                            </td>

                            <td className={styles.code}>
                              {renderHighlightedCode(code, language)}
                            </td>
                          </>
                        )}
                      </Commentable>
                      {selectedMessageMap && selectedMessageMap.byLine[line] && (
                        <tr>
                          <td
                            id={`line-${line}-messages`}
                            className={styles.linterMessages}
                            colSpan={2}
                          >
                            {selectedMessageMap.byLine[line].map((msg) => {
                              return (
                                <LinterMessage
                                  inline
                                  key={msg.uid}
                                  message={msg}
                                />
                              );
                            })}
                          </td>
                        </tr>
                      )}
                      {enableCommenting && (
                        <CommentList
                          addonId={version.addon.id}
                          fileName={selectedPath}
                          line={line}
                          versionId={version.id}
                        >
                          {(commentList) => (
                            <tr>
                              <td colSpan={2}>{commentList}</td>
                            </tr>
                          )}
                        </CommentList>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FadableContent>
        {/* Only show a slow alert at the bottom if the code was trimmed. */}
        {codeWasTrimmed && slowAlert}
      </>
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
        {// This needs to be an anonymous function (which defeats memoization)
        // so that the component gets re-rendered in the case of adding
        // comments per line.
        (info: LinterProviderInfo) => this.renderWithLinterInfo(info)}
      </LinterProvider>
    );
  }
}

export default withRouter(CodeViewBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
