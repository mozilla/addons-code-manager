import * as React from 'react';
import { connect } from 'react-redux';

import { ApplicationState, ConnectedReduxProps } from '../../configureStore';
import styles from './styles.module.scss';
import {
  ExampleState,
  actions as exampleActions,
} from '../../reducers/example';

type PublicProps = {};

type PropsFromState = {
  toggledOn: ExampleState['toggledOn'];
};

class App extends React.Component<
  PublicProps & PropsFromState & ConnectedReduxProps
> {
  handleToggleClick = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    const { dispatch } = this.props;
    event.preventDefault();
    dispatch(exampleActions.toggle());
  };

  render() {
    const { toggledOn } = this.props;

    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <p>Toggle this on and off to test out Redux:</p>
          <p>
            <button
              onClick={this.handleToggleClick}
              style={{ padding: '32px' }}
            >
              {toggledOn ? 'OFF' : 'ON'}
            </button>
          </p>
        </header>
      </div>
    );
  }
}

const mapStateToProps = (state: ApplicationState): PropsFromState => {
  return {
    toggledOn: state.example.toggledOn,
  };
};

export default connect(mapStateToProps)(App);
