import log from 'loglevel';
import ReactGA from 'react-ga';

type IsDoNoTrackEnabledParams = {
  _navigator?: Navigator | null;
  _window?: Window | null;
};

export function isDoNotTrackEnabled({
  _navigator = navigator,
  _window = window,
}: IsDoNoTrackEnabledParams = {}): boolean {
  if (!_navigator || !_window) {
    return false;
  }

  // We ignore things like `msDoNotTrack` because they are for older,
  // unsupported browsers and don't really respect the DNT spec. This
  // covers new versions of IE/Edge, Firefox from 32+, Chrome, Safari, and
  // any browsers built on these stacks (Chromium, Tor Browser, etc.).
  const dnt = _navigator.doNotTrack || _window.doNotTrack;
  if (dnt === '1') {
    log.debug('Do Not Track is enabled');
    return true;
  }

  // Known DNT values not set, so we will assume it's off.
  return false;
}

type TrackingParams = {
  _isDoNotTrackEnabled?: typeof isDoNotTrackEnabled;
  _reactGA?: typeof ReactGA;
  trackingEnabled?: boolean;
  trackingId?: string | null;
  useMock?: boolean;
};

export class Tracking {
  _reactGA?: typeof ReactGA;

  logPrefix?: string;

  trackingEnabled?: boolean;

  constructor({
    _isDoNotTrackEnabled = isDoNotTrackEnabled,
    _reactGA = ReactGA,
    trackingEnabled = process.env.REACT_APP_TRACKING_ENABLED === 'true',
    trackingId = process.env.REACT_APP_TRACKING_ID,
    // We need to set useMock to true in the tests in order to use a provided
    // mock, because of the check below for
    // process.env.NODE_ENV !== 'production', which itself is needed to avoid
    // an exception when running tests.
    useMock = false,
  }: TrackingParams = {}) {
    this.logPrefix = '[GA]'; // this gets updated below

    if (process.env.NODE_ENV === 'test' && !useMock) {
      log.debug(`GA disabled because NODE_ENV === 'test'`);
      this.trackingEnabled = false;
    } else if (!trackingEnabled) {
      log.debug('GA disabled because trackingEnabled was false');
      this.trackingEnabled = false;
    } else if (!trackingId) {
      log.debug('GA Disabled because trackingId was empty');
      this.trackingEnabled = false;
    } else if (_isDoNotTrackEnabled()) {
      log.debug(
        'Do Not Track Enabled; Google Analytics not loaded and tracking disabled',
      );
      this.trackingEnabled = false;
    } else {
      log.debug('Google Analytics is enabled');
      this.trackingEnabled = true;
    }

    this.logPrefix = `[GA: ${this.trackingEnabled ? 'ON' : 'OFF'}]`;

    if (this.trackingEnabled && trackingId) {
      this._reactGA = _reactGA;
      this._reactGA.initialize(trackingId, {
        debug:
          process.env.NODE_ENV !== 'production' &&
          process.env.REACT_APP_GA_DEBUG_MODE === 'true',
        titleCase: false,
        gaOptions: {
          siteSpeedSampleRate: 100,
        },
      });
      this._reactGA.set({ transport: 'beacon' });
    }
  }

  timing = (params: ReactGA.TimingArgs) => {
    if (this._reactGA) {
      this._reactGA.timing(params);
      log.info(this.logPrefix, `Sending timing for ${JSON.stringify(params)}`);
    }
  };
}

export default new Tracking();
