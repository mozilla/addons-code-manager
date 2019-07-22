import * as React from 'react';
import { withRouter, Link, RouteComponentProps } from 'react-router-dom';
import makeClassName from 'classnames';

import styles from './styles.module.scss';
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
const SLOW_LOADING_LINE_COUNT = 1000;

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

export const scrollToSelectedLine = (
  element: HTMLTableRowElement | HTMLDivElement | null,
) => {
  if (element) {
    element.scrollIntoView();
  }
};

export type PublicProps = {
  mimeType: string;
  content: string;
  version: Version;
};

export type DefaultProps = {
  _scrollToSelectedLine: typeof scrollToSelectedLine;
  _slowLoadingLineCount: number;
};

type Props = PublicProps & DefaultProps & RouteComponentProps;

type RowProps = {
  className: string;
  id: string;
  ref?: typeof scrollToSelectedLine;
};

export class CodeViewBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _scrollToSelectedLine: scrollToSelectedLine,
    _slowLoadingLineCount: SLOW_LOADING_LINE_COUNT,
  };

  renderWithLinterInfo = ({ selectedMessageMap }: LinterProviderInfo) => {
    const {
      _scrollToSelectedLine,
      _slowLoadingLineCount,
      content,
      location,
      mimeType,
    } = this.props;

    const language = getLanguageFromMimeType(mimeType);
    let codeLines = getLines(content);
    let codeWasTrimmed = false;
    let codeIsSlowAlert;

    if (codeLines.length >= _slowLoadingLineCount) {
      if (!shouldAllowSlowPages(location)) {
        codeLines = codeLines.slice(0, _slowLoadingLineCount);
        codeWasTrimmed = true;
      }
      codeIsSlowAlert = (
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
      <React.Fragment>
        <GlobalLinterMessages
          containerRef={
            isLineSelected(getCodeLineAnchorID(0), location)
              ? _scrollToSelectedLine
              : undefined
          }
          messages={selectedMessageMap && selectedMessageMap.global}
        />

        {codeIsSlowAlert}

        <FadableContent fade={codeWasTrimmed}>
          <div className={styles.CodeView}>
            <table className={styles.table}>
              <tbody className={styles.tableBody}>
                {codeLines.map((code, i) => {
                  const line = i + 1;

                  let rowProps: RowProps = {
                    id: getCodeLineAnchorID(line),
                    className: styles.line,
                  };

                  if (isLineSelected(rowProps.id, location)) {
                    rowProps = {
                      ...rowProps,
                      className: makeClassName(
                        rowProps.className,
                        styles.selectedLine,
                      ),
                      ref: _scrollToSelectedLine,
                    };
                  }

                  return (
                    <React.Fragment key={`fragment-${line}`}>
                      <tr {...rowProps}>
                        <td className={styles.lineNumber}>
                          <Link
                            to={{
                              ...location,
                              hash: getCodeLineAnchor(line),
                            }}
                          >{`${line}`}</Link>
                        </td>

                        <td className={styles.code}>
                          {renderHighlightedCode(code, language)}
                        </td>
                      </tr>
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
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FadableContent>
        {/* Only show a slow alert at the bottom if the code was trimmed. */}
        {codeWasTrimmed && codeIsSlowAlert}
      </React.Fragment>
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
        {this.renderWithLinterInfo}
      </LinterProvider>
    );
  }
}

export default withRouter(CodeViewBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
