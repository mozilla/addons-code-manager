import * as React from 'react';
import log from 'loglevel';
import { withRouter, Link, RouteComponentProps } from 'react-router-dom';
import makeClassName from 'classnames';
import chunk from 'lodash.chunk';
import debounce from 'lodash.debounce';

import {
  getCodeLineAnchor as defaultCodeLineAnchorGetter,
  getLines,
  GLOBAL_LINTER_ANCHOR_ID,
} from '../CodeView/utils';
import {
  LinterMessage as LinterMessageType,
  findMostSevereType,
} from '../../reducers/linter';
import styles from './styles.module.scss';
import { gettext } from '../../utils';
import { Version } from '../../reducers/versions';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import CodeLineShapes from '../CodeLineShapes';
import {
  AllLineShapes,
  LineShapes,
  generateLineShapes,
} from '../CodeLineShapes/utils';

export type PublicProps = {
  content: string;
  version: Version;
};

export type DefaultProps = {
  _debounce: typeof debounce;
  _document: typeof document;
  _window: {
    addEventListener: typeof window.addEventListener;
    removeEventListener: typeof window.removeEventListener;
  };
  createOverviewRef: () => React.RefObject<HTMLDivElement> | null;
  getCodeLineAnchor: typeof defaultCodeLineAnchorGetter;
  insertedLines: number[];
  overviewPadding: number;
  rowTopPadding: number;
  rowHeight: number;
};

export type Props = PublicProps & DefaultProps & RouteComponentProps;

type State = {
  // This is the height of the overview div in pixels.
  overviewHeight: number | null;
};

export class CodeOverviewBase extends React.Component<Props, State> {
  static defaultProps = {
    _debounce: debounce,
    _document: document,
    _window: window,
    createOverviewRef: () => React.createRef<HTMLDivElement>(),
    getCodeLineAnchor: defaultCodeLineAnchorGetter,
    insertedLines: [],
    // This is the padding of the overview container.
    overviewPadding: 10,
    rowTopPadding: 2,
    // This is the height of the row, including rowTopPadding.
    rowHeight: 10,
  };

  private overviewRef: React.RefObject<HTMLDivElement> | null;

  constructor(props: Props) {
    super(props);

    this.state = { overviewHeight: null };
    this.overviewRef = this.props.createOverviewRef();
  }

  componentDidMount() {
    const { _window } = this.props;
    this.setOverviewHeight();

    // When the user begins resizing, first clear the overview contents.
    _window.addEventListener('resize', this.resetOverviewHeight);
    // After a short delay, get the new height and re-render.
    _window.addEventListener('resize', this.waitAndSetNewOverviewHeight);
  }

  componentDidUpdate() {
    this.setOverviewHeight();
  }

  componentWillUnmount() {
    const { _window } = this.props;
    _window.removeEventListener('resize', this.resetOverviewHeight);
    _window.removeEventListener('resize', this.waitAndSetNewOverviewHeight);
  }

  resetOverviewHeight = () => {
    this.setState({ overviewHeight: null });
  };

  setOverviewHeight = () => {
    const { overviewHeight } = this.state;
    const ref = this.overviewRef;

    if (ref && ref.current) {
      const refHeight = ref.current.clientHeight;
      if (overviewHeight !== refHeight) {
        this.setState({ overviewHeight: refHeight });
      }
    }
  };

  waitAndSetNewOverviewHeight = this.props._debounce(
    () => this.setOverviewHeight(),
    200,
  );

  fitLineShapesIntoOverview(allLineShapes: AllLineShapes) {
    const { overviewPadding, rowHeight, rowTopPadding } = this.props;
    const { overviewHeight } = this.state;

    if (!overviewHeight) {
      throw new Error(
        'overviewHeight must be set when calling fitLineShapesIntoOverview()',
      );
    }

    const availableHeight =
      overviewHeight -
      // Remove the top and bottom div padding.
      overviewPadding * 2 -
      // Adjust for the first row not having padding.
      rowTopPadding;

    const numberOfRows = Math.floor(availableHeight / rowHeight);

    let chunkSize = 1;
    if (allLineShapes.length > numberOfRows) {
      // Split file lines evenly between all rows.
      chunkSize = Math.ceil(allLineShapes.length / numberOfRows);
    }

    return {
      numberOfRows,
      chunkedLineShapes: chunk(allLineShapes, chunkSize),
    };
  }

  renderRow(
    selectedMessageMap: LinterProviderInfo['selectedMessageMap'],
    rowIndex: number,
    shapeIndex: number,
    groupOflineShapes: LineShapes[] | undefined,
    insertedLines: number[],
  ) {
    if (!groupOflineShapes) {
      return null;
    }

    // First check to see if we should colour the line because of changes.
    if (insertedLines.length) {
      for (const shape of groupOflineShapes) {
        if (insertedLines.includes(shape.line)) {
          return <CodeLineShapes isChange lineShapes={shape} />;
        }
      }
    }

    // Next check to see if there are any messages for the line.
    const messages = selectedMessageMap
      ? groupOflineShapes.reduce((matches: LinterMessageType[], shape) => {
          let allMatches = matches;
          if (shape.line === 1 && selectedMessageMap.global.length) {
            allMatches = allMatches.concat(selectedMessageMap.global);
          }
          if (selectedMessageMap.byLine[shape.line]) {
            allMatches = allMatches.concat(
              selectedMessageMap.byLine[shape.line],
            );
          }

          return allMatches;
        }, [])
      : [];

    if (messages.length) {
      const type = findMostSevereType(messages);
      return (
        <div
          key={messages.map((m) => m.uid).join(':')}
          className={makeClassName(styles.linterMessage, {
            [styles.linterError]: type === 'error',
            [styles.linterWarning]: type === 'warning',
            [styles.linterNotice]: type === 'notice',
          })}
        />
      );
    }

    const lineShapes = groupOflineShapes[shapeIndex];

    return <CodeLineShapes lineShapes={lineShapes} />;
  }

  renderOverview(selectedMessageMap: LinterProviderInfo['selectedMessageMap']) {
    const {
      _document,
      content,
      getCodeLineAnchor,
      insertedLines,
      location,
      rowHeight,
      rowTopPadding,
    } = this.props;
    const { overviewHeight } = this.state;

    if (!overviewHeight) {
      return null;
    }

    const allLineShapes = generateLineShapes(getLines(content));
    const { numberOfRows, chunkedLineShapes } = this.fitLineShapesIntoOverview(
      allLineShapes,
    );
    const overview = [];

    for (let rowIndex = 0; rowIndex < numberOfRows; rowIndex++) {
      const shapes = chunkedLineShapes[rowIndex];
      // Use the first line in the group.
      const shapeIndex = 0;
      // The line might be undefined when we've run out of code to display
      // but still need to pad the overview grid with content.
      const line =
        shapes && shapes.length ? shapes[shapeIndex].line : undefined;

      let linkableLine = line;
      if (line && insertedLines.length) {
        // Look for the first line with a change on it and link to
        // that instead.
        const firstChange = shapes.filter((s) =>
          insertedLines.includes(s.line),
        )[0];
        if (firstChange) {
          linkableLine = firstChange.line;
        }
      } else if (
        line &&
        line === 1 &&
        selectedMessageMap &&
        selectedMessageMap.global.length
      ) {
        linkableLine = GLOBAL_LINTER_ANCHOR_ID;
      } else if (line && selectedMessageMap) {
        // Look for the first line with a linter message on it and link to
        // that instead.
        const firstMsg = shapes.filter(
          (s) => selectedMessageMap.byLine[s.line],
        )[0];
        if (firstMsg) {
          linkableLine = firstMsg.line;
        }
      }

      const codeLineAnchor =
        linkableLine !== undefined ? getCodeLineAnchor(linkableLine) : null;

      const scrollToLine = (
        event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
      ) => {
        // Explicitly scroll to the linter message in case the user had
        // scrolled it out of view.
        // Example: https://github.com/mozilla/addons-code-manager/issues/682
        if (!codeLineAnchor) {
          event.preventDefault();
          return;
        }
        const domLine = _document.querySelector(codeLineAnchor);
        if (!domLine) {
          log.error(
            `Anchor "${codeLineAnchor}" unexpectedly does not exist on the page`,
          );
          return;
        }

        domLine.scrollIntoView();
      };

      overview.push(
        <Link
          className={styles.line}
          to={{
            ...location,
            hash: codeLineAnchor || '#',
          }}
          key={rowIndex}
          onClick={scrollToLine}
          style={{
            height: `${rowHeight}px`,
            paddingTop: rowIndex > 0 ? `${rowTopPadding}px` : undefined,
          }}
          title={line ? gettext(`Jump to line ${line}`) : ''}
        >
          {this.renderRow(
            selectedMessageMap,
            rowIndex,
            shapeIndex,
            shapes,
            insertedLines,
          )}
        </Link>,
      );
    }

    return overview;
  }

  renderWithLinterInfo = ({ selectedMessageMap }: LinterProviderInfo) => {
    return (
      <div
        ref={this.overviewRef}
        className={styles.CodeOverview}
        style={{
          padding: `${this.props.overviewPadding}px`,
        }}
      >
        {this.renderOverview(selectedMessageMap)}
      </div>
    );
  };

  render() {
    const { overviewHeight } = this.state;
    const { version } = this.props;

    return (
      <LinterProvider
        key={overviewHeight ? String(overviewHeight) : ''}
        version={version}
        selectedPath={version.selectedPath}
      >
        {
          // This needs to be an anonymous function (which defeats memoization)
          // so that the component gets re-rendered in the case of insertedLines
          // changing (e.g., when switching between versions).
          (info: LinterProviderInfo) => this.renderWithLinterInfo(info)
        }
      </LinterProvider>
    );
  }
}

export default withRouter(CodeOverviewBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
