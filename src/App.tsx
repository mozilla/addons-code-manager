import * as React from 'react';
import { connect } from 'react-redux';

import { ApplicationState, ConnectedReduxProps } from './configureStore';
import logo from './logo.svg';
import styles from './App.module.scss';
import { ExampleState, toggleOn, toggleOff } from './reducers/example';

interface Props {
  toggleState: ExampleState['toggle'];
}

class App extends React.Component<Props & ConnectedReduxProps, {}> {
  handleToggleClick = (event: React.SyntheticEvent<any>) => {
    const { dispatch, toggleState } = this.props;
    event.preventDefault();

    if (toggleState === 'on') {
      dispatch(toggleOff());
    } else {
      dispatch(toggleOn());
    }
  };

  render() {
    const { toggleState } = this.props;

    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <img src={logo} className={styles.logo} alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className={styles.link}
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <p>Toggle this on and off to test out Redux:</p>
          <p>
            <button
              onClick={this.handleToggleClick}
              style={{ padding: '32px' }}
            >
              {toggleState === 'on' ? 'OFF' : 'ON'}
            </button>
          </p>
        </header>
      </div>
    );
  }
}

function mapStateToProps(state: ApplicationState) {
  return {
    toggleState: state.example.toggle,
  };
}

export default connect(mapStateToProps)(App);
