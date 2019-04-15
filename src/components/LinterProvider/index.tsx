import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import {
  LinterMessageMap,
  LinterMessagesByPath,
  fetchLinterMessages,
  selectMessageMap,
} from '../../reducers/linter';

export type LinterProviderInfo = {
  messageMap: LinterMessageMap | void;
  messagesAreLoading: boolean;
  selectedMessageMap: LinterMessagesByPath | null | void;
};

type LoadData = () => void;

export type RenderWithMessages = (info: LinterProviderInfo) => React.ReactNode;

export type PublicProps = {
  _loadData?: LoadData;
  children: RenderWithMessages;
  versionId: number;
  validationURL: string;
  selectedPath: string;
};

export type DefaultProps = {
  _fetchLinterMessages: typeof fetchLinterMessages;
};

type PropsFromState = LinterProviderInfo;

export type Props = PublicProps &
  DefaultProps &
  PropsFromState &
  ConnectedReduxProps &
  RouteComponentProps;

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
      validationURL,
      versionId,
      messageMap,
      messagesAreLoading,
    } = this.props;

    if (messageMap === undefined && !messagesAreLoading) {
      dispatch(
        _fetchLinterMessages({
          versionId,
          url: validationURL,
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

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicProps & RouteComponentProps,
): PropsFromState => {
  const { selectedPath, versionId } = ownProps;

  let selectedMessageMap;
  const map = selectMessageMap(state.linter, versionId);
  if (map) {
    selectedMessageMap = map[selectedPath]
      ? map[selectedPath]
      : // No messages exist for this path.
        null;
  }

  return {
    messageMap: map,
    messagesAreLoading: state.linter.isLoading,
    selectedMessageMap,
  };
};

// withRouter() is currently only used to control the memoization
// behavior of mapStateToProps(). We need new values of ownProps.location
// to trigger a re-render.
// More details: https://github.com/mozilla/addons-code-manager/issues/559
export default withRouter(connect(mapStateToProps)(LinterProviderBase));
