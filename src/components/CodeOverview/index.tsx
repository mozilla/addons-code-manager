import * as React from 'react';
import makeClassName from 'classnames';
import debounce from 'lodash.debounce';

// TODO: move getLines() to a common location.
import { getLines } from '../CodeView/utils';
import { LinterMessage as LinterMessageType } from '../../reducers/linter';
import styles from './styles.module.scss';
import { gettext } from '../../utils';
import { Version } from '../../reducers/versions';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';

// This is the line length to cut the shape off at.
const MAX_LINE_LENGTH = 40;
const NO_TOKEN = -1;
const WHITESPACE_TOKEN = 0;
const CODE_TOKEN = 1;

// This represents one or more code tokens.
type CodeShape = {
  // TODO: make this better, maybe.
  token: number;
  count: number;
};

// This is a collection of shapes for one line of code.
type LineShapes = {
  line: number;
  shapes: CodeShape[];
};

// These are shape collections for all lines of code.
type AllLineShapes = LineShapes[];

type ChunkedLineShapes = LineShapes[][];

export type PublicProps = {
  content: string;
  version: Version;
};

type Props = PublicProps;

type State = {
  // This is the height of the overview div in pixels.
  overviewHeight: number | null;
};

export const splitArrayIntoChunks = <ItemType extends {}>(
  array: ItemType[],
  chunkSize: number,
): ItemType[][] => {
  const chunked = [];

  let index = 0;
  while (index < array.length) {
    chunked.push(array.slice(index, index + chunkSize));
    index += chunkSize;
  }

  return chunked;
};

export default class CodeOverview extends React.Component<Props, State> {
  public state = { overviewHeight: null };

  private overviewRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.setOverviewHeight();

    // When the user begins resizing, first clear the overview contents.
    window.addEventListener('resize', this.resetOverviewHeight);
    // After a short delay, get the new height and re-render.
    window.addEventListener('resize', this.waitAndSetNewOverviewHeight);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resetOverviewHeight);
    window.removeEventListener('resize', this.waitAndSetNewOverviewHeight);
  }

  resetOverviewHeight = () => {
    this.setState({ overviewHeight: null });
  };

  setOverviewHeight = () => {
    if (this.overviewRef && this.overviewRef.current) {
      this.setState({ overviewHeight: this.overviewRef.current.clientHeight });
    }
  };

  waitAndSetNewOverviewHeight = debounce(this.setOverviewHeight, 200, {
    leading: false,
    trailing: true,
  });

  createAllLineShapes() {
    const fileLines = getLines(this.props.content);

    const allLineShapes: AllLineShapes = [];

    fileLines.forEach((code, lineIndex) => {
      const line = lineIndex + 1;
      const characters = code.split('');

      const lineShapes: LineShapes = {
        line,
        shapes: [{ token: NO_TOKEN, count: 0 }],
      };
      const getLastShape = () =>
        lineShapes.shapes[lineShapes.shapes.length - 1];

      for (let i = 0; i < MAX_LINE_LENGTH; i++) {
        const char = characters[i] || ' ';
        const token = char === ' ' ? WHITESPACE_TOKEN : CODE_TOKEN;

        if (getLastShape().token !== token) {
          lineShapes.shapes.push({ token, count: 0 });
        }

        const shape = getLastShape();
        shape.count += 1;
      }

      // Remove the NO_TOKEN item because that was just a
      // convenient initializer.
      lineShapes.shapes.shift();

      allLineShapes.push(lineShapes);
    });

    return allLineShapes;
  }

  renderRow(
    selectedMessageMap: LinterProviderInfo['selectedMessageMap'],
    rowIndex: number,
    groupOflineShapes: LineShapes[] | void,
  ) {
    if (!groupOflineShapes) {
      return null;
    }

    const messages = selectedMessageMap
      ? groupOflineShapes.reduce((matches: LinterMessageType[], shape) => {
          if (selectedMessageMap.byLine[shape.line]) {
            return matches.concat(selectedMessageMap.byLine[shape.line]);
          }

          return matches;
        }, [])
      : [];

    if (messages.length) {
      // TODO: refactor findMostSevereTypeForPath from FileTreeNode
      // and use it.
      const { type } = messages[0];
      return (
        <div
          key={messages.map((m) => m.uid).join(':')}
          className={makeClassName(styles.linterMessage, {
            [styles.linterError]: type === 'error',
            [styles.linterWarning]: type === 'warning',
            // TODO: support notices
            // [styles.linterNotice]: type === 'notice',
          })}
        />
      );
    }

    // Render the first line in the group.
    const lineShapes = groupOflineShapes[0];

    return lineShapes.shapes.map((shape, shapeIndex) => {
      const width = (shape.count / MAX_LINE_LENGTH) * 100;

      let className;
      if (shape.token === WHITESPACE_TOKEN) {
        className = styles.codeShapeWhitespace;
      } else {
        className = styles.codeShape;
      }

      return (
        <div
          key={[shapeIndex.toString(), width.toString(), className].join(':')}
          className={className}
          style={{ width: `${width}%` }}
        />
      );
    });
  }

  renderOverview(selectedMessageMap: LinterProviderInfo['selectedMessageMap']) {
    if (!this.state.overviewHeight) {
      return null;
    }

    // TODO: somehow synchronize with the $default-padding value? Hmm.

    // Calculate the height of the overview div minus $default-padding.
    const innerOverviewHeight = (this.state.overviewHeight || 0) - 20;

    const linePadding = 2;
    const lineHeight = 10;

    // The first item won't have padding so factor that in.
    const numberOfRows = Math.floor(
      (innerOverviewHeight - linePadding) / lineHeight,
    );

    const allLineShapes = this.createAllLineShapes();

    let chunkSize = 1;
    if (allLineShapes.length > numberOfRows) {
      // Split file lines evenly between all rows.
      chunkSize = Math.ceil(allLineShapes.length / numberOfRows);
    }

    const chunkedLineShapes = splitArrayIntoChunks<LineShapes>(
      allLineShapes,
      chunkSize,
    );

    const content = [];

    for (let rowIndex = 0; rowIndex < numberOfRows; rowIndex++) {
      const shapes = chunkedLineShapes[rowIndex] || undefined;
      // Use the first line in the group.
      const line = shapes ? shapes[0].line : undefined;

      // TODO: use a shared function for creating line anchor HREFs.
      content.push(
        <a
          href={`#${line ? `L${line}` : ''}`}
          key={rowIndex}
          className={styles.line}
          style={{
            height: `${lineHeight}px`,
            paddingTop: rowIndex > 0 ? `${linePadding}px` : undefined,
          }}
          title={line ? gettext(`Jump to line ${line}`) : ''}
        >
          {this.renderRow(selectedMessageMap, rowIndex, shapes)}
        </a>,
      );
    }

    return content;
  }

  renderWithLinterInfo = ({ selectedMessageMap }: LinterProviderInfo) => {
    return (
      <div ref={this.overviewRef} className={styles.CodeOverview}>
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
        versionId={version.id}
        validationURL={version.validationURL}
        selectedPath={version.selectedPath}
      >
        {this.renderWithLinterInfo}
      </LinterProvider>
    );
  }
}
