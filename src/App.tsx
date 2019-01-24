import * as React from 'react';
import { connect } from 'react-redux';

import { ApplicationState, ConnectedReduxProps } from './configureStore';
import logo from './logo.svg';
import styles from './App.module.scss';
import { ExampleState, toggle } from './reducers/example';

interface PublicProps {}

interface PropsFromState {
  toggledOn: ExampleState['toggledOn'];
}

class App extends React.Component<
  PublicProps & PropsFromState & ConnectedReduxProps
> {
  handleToggleClick = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    const { dispatch } = this.props;
    event.preventDefault();
    dispatch(toggle());
  };

  render() {
    const { toggledOn } = this.props;

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
              {toggledOn ? 'OFF' : 'ON'}
            </button>
          </p>
        </header>
      </div>
    );
  }
}

function mapStateToProps(state: ApplicationState) {
  return {
    toggledOn: state.example.toggledOn,
  };
}

export default connect(mapStateToProps)(App);
