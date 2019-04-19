import * as React from 'react';
import { withRouter, Link, RouteComponentProps } from 'react-router-dom';
import chunk from 'lodash.chunk';
import debounce from 'lodash.debounce';

import { getCodeLineAnchor, getLines } from '../CodeView/utils';
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
  _window: {
    addEventListener: typeof window.addEventListener;
    removeEventListener: typeof window.removeEventListener;
  };
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
    _window: window,
    // This is the padding of the overview container.
    overviewPadding: 10,
    rowTopPadding: 2,
    // This is the height of the row, including rowTopPadding.
    rowHeight: 10,
  };

  public state = { overviewHeight: null };

  private overviewRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    const { _window } = this.props;
    this.setOverviewHeight();

    // When the user begins resizing, first clear the overview contents.
    _window.addEventListener('resize', this.resetOverviewHeight);
    // After a short delay, get the new height and re-render.
    _window.addEventListener('resize', this.waitAndSetNewOverviewHeight);
  }

  componentWillUnmount() {
    const { _window } = this.props;
    _window.removeEventListener('resize', this.resetOverviewHeight);
    _window.removeEventListener('resize', this.waitAndSetNewOverviewHeight);
  }

  resetOverviewHeight = () => {
    this.setState({ overviewHeight: null });
  };

  setOverviewHeight = (ref = this.overviewRef) => {
    if (ref && ref.current) {
      this.setState({ overviewHeight: ref.current.clientHeight });
    }
  };

  waitAndSetNewOverviewHeight = this.props._debounce(
    () => this.setOverviewHeight(),
    200,
    {
      leading: false,
      trailing: true,
    },
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
    groupOflineShapes: LineShapes[] | void,
  ) {
    if (!groupOflineShapes) {
      return null;
    }

    // TODO: render linter messages here.
    // See https://github.com/mozilla/addons-code-manager/issues/523

    // Render the first line in the group.
    const lineShapes = groupOflineShapes[0];

    return <CodeLineShapes lineShapes={lineShapes} />;
  }

  renderOverview(selectedMessageMap: LinterProviderInfo['selectedMessageMap']) {
    const { content, location, rowHeight, rowTopPadding } = this.props;
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
      const shapes = chunkedLineShapes[rowIndex] || undefined;
      // Use the first line in the group.
      const line = shapes ? shapes[0].line : undefined;

      overview.push(
        <Link
          className={styles.line}
          to={{
            ...location,
            hash: line ? getCodeLineAnchor(line) : '#',
          }}
          key={rowIndex}
          style={{
            height: `${rowHeight}px`,
            paddingTop: rowIndex > 0 ? `${rowTopPadding}px` : undefined,
          }}
          title={line ? gettext(`Jump to line ${line}`) : ''}
        >
          {this.renderRow(selectedMessageMap, rowIndex, shapes)}
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
        versionId={version.id}
        validationURL={version.validationURL}
        selectedPath={version.selectedPath}
      >
        {this.renderWithLinterInfo}
      </LinterProvider>
    );
  }
}

export default withRouter(CodeOverviewBase) as React.ComponentType<
  PublicProps & Partial<DefaultProps>
>;
