import { Tracking, isDoNotTrackEnabled } from './tracking';

const createTracking = (params = {}) => {
  return new Tracking({
    _isDoNotTrackEnabled: jest.fn().mockReturnValue(false),
    useMock: true,
    trackingEnabled: true,
    trackingId: 'sample-tracking-id',
    ...params,
  });
};

const _isDoNotTrackEnabled = ({
  _navigator,
  _window,
}: {
  _navigator: { doNotTrack?: string };
  _window: { doNotTrack?: string };
}) => {
  return isDoNotTrackEnabled({
    _navigator: _navigator as Navigator,
    _window: _window as Window,
  });
};

describe(__filename, () => {
  describe('isDoNotTrackEnabled', () => {
    it('should respect DNT when enabled', () => {
      expect(
        _isDoNotTrackEnabled({ _navigator: { doNotTrack: '1' }, _window: {} }),
      ).toBe(true);

      expect(
        _isDoNotTrackEnabled({ _navigator: {}, _window: { doNotTrack: '1' } }),
      ).toBe(true);
    });

    it('should respect not enabled DNT', () => {
      expect(
        _isDoNotTrackEnabled({ _navigator: { doNotTrack: '0' }, _window: {} }),
      ).toBe(false);
      expect(
        _isDoNotTrackEnabled({ _navigator: {}, _window: { doNotTrack: '0' } }),
      ).toBe(false);
    });

    it('should treat unknown values as no DNT', () => {
      expect(
        _isDoNotTrackEnabled({
          _navigator: { doNotTrack: 'leave me alone' },
          _window: {},
        }),
      ).toBe(false);
      expect(
        _isDoNotTrackEnabled({
          _navigator: {},
          _window: { doNotTrack: 'leave me alone' },
        }),
      ).toBe(false);
    });

    it('should handle missing navigator and window', () => {
      expect(isDoNotTrackEnabled({ _navigator: undefined })).toBe(false);
      expect(isDoNotTrackEnabled({ _window: undefined })).toBe(false);
    });
  });

  describe('Tracking', () => {
    it('can initialize ReactGA', () => {
      const _reactGA = { initialize: jest.fn() };
      const trackingId = 'some-tracking-id';

      createTracking({ _reactGA, trackingId });
      expect(_reactGA.initialize).toHaveBeenCalledWith(
        trackingId,
        expect.objectContaining({ debug: true }),
      );
    });

    it('should not enable ReactGA when configured off', () => {
      const _reactGA = { initialize: jest.fn() };
      createTracking({ _reactGA, trackingEnabled: false });
      expect(_reactGA.initialize).not.toHaveBeenCalled();
    });

    it('should disable ReactGA due to missing id', () => {
      const _reactGA = { initialize: jest.fn() };
      createTracking({ _reactGA, trackingId: null });
      expect(_reactGA.initialize).not.toHaveBeenCalled();
    });

    it('should disable ReactGA due to Do Not Track', () => {
      const _reactGA = { initialize: jest.fn() };
      createTracking({
        _isDoNotTrackEnabled: jest.fn().mockReturnValue(true),
        _reactGA,
      });
      expect(_reactGA.initialize).not.toHaveBeenCalled();
    });
  });

  describe('timing', () => {
    it('should not send timings when tracking is configured off', () => {
      const _reactGA = { timing: jest.fn() };
      const tracking = createTracking({ _reactGA, trackingEnabled: false });
      tracking.timing({
        category: 'some category',
        variable: 'some variable',
        value: 19,
      });
      expect(_reactGA.timing).not.toHaveBeenCalled();
    });

    it('should call ga with timing', () => {
      const _reactGA = { initialize: jest.fn(), timing: jest.fn() };
      const tracking = createTracking({ _reactGA });
      const trackingParams = {
        category: 'some category',
        variable: 'some variable',
        value: 19,
        label: 'some label',
      };
      tracking.timing(trackingParams);
      expect(_reactGA.timing).toHaveBeenCalledWith(trackingParams);
    });
  });
});
