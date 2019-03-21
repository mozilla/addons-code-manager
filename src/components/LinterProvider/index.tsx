import * as React from 'react';
import { connect } from 'react-redux';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import {
  LinterMessageMap,
  LinterMessagesByPath,
  LinterState,
  fetchLinterMessages,
  selectMessageMap,
} from '../../reducers/linter';
import { Version } from '../../reducers/versions';

export type LinterMessageInfo = {
  messageMap: LinterMessageMap | void;
  messagesAreLoading: boolean;
  selectedMessageMap: LinterMessagesByPath | null | void;
};

type LoadData = () => void;

export type RenderWithMessages = (info: LinterMessageInfo) => React.ReactNode;

export type PublicProps = {
  _loadData?: LoadData;
  children: RenderWithMessages;
  version: Version;
};

export type DefaultProps = {
  _fetchLinterMessages: typeof fetchLinterMessages;
};

type PropsFromState = LinterMessageInfo;

export type Props = PublicProps &
  DefaultProps &
  PropsFromState &
  ConnectedReduxProps;

export class LinterProviderBase extends React.Component<Props> {
  loadData: LoadData;

  static defaultProps: DefaultProps = {
    _fetchLinterMessages: fetchLinterMessages,
  };

  constructor(props: Props) {
    super(props);
    // Allow dependency injection to test all the ways loadData() gets executed.
    this.loadData = props._loadData || this._loadData;
  }

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate() {
    this.loadData();
  }

  _loadData = () => {
    const {
      _fetchLinterMessages,
      dispatch,
      version,
      messageMap,
      messagesAreLoading,
    } = this.props;

    if (messageMap === undefined && !messagesAreLoading) {
      dispatch(
        _fetchLinterMessages({
          versionId: version.id,
          url: version.validationURL,
        }),
      );
    }
  };

  render() {
    const { messageMap, messagesAreLoading, selectedMessageMap } = this.props;

    return this.props.children({
      messageMap,
      messagesAreLoading,
      selectedMessageMap,
    });
  }
}

export const createLinterMessageInfo = (
  linterState: LinterState,
  version: Version,
): LinterMessageInfo => {
  let selectedMessageMap;
  const map = selectMessageMap(linterState, version.id);
  if (map) {
    selectedMessageMap = map[version.selectedPath]
      ? map[version.selectedPath]
      : // No messages exist for this path.
        null;
  }

  return {
    messageMap: map,
    messagesAreLoading: linterState.isLoading,
    selectedMessageMap,
  };
};

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicProps,
): PropsFromState => {
  return createLinterMessageInfo(state.linter, ownProps.version);
};

export default connect(mapStateToProps)(LinterProviderBase);
