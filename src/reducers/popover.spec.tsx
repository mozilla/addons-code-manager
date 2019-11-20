import reducer, {
  actions,
  selectPopoverIsVisible,
  initialState,
} from './popover';

describe(__filename, () => {
  it('can show a popover', () => {
    const id = 'COMMENTS_SUMMARY';
    let state;
    state = reducer(state, actions.hide(id));
    state = reducer(state, actions.show(id));

    expect(state.current).toEqual(id);
  });

  it('can hide a popover', () => {
    const id = 'COMMENTS_SUMMARY';
    let state;
    state = reducer(state, actions.show(id));
    state = reducer(state, actions.hide(id));

    expect(state.current).toEqual(undefined);
  });

  it('can override the currently shown popover', () => {
    const first = 'COMMENTS_SUMMARY';
    const second = 'COMPARE_VERSIONS';
    let state;
    state = reducer(state, actions.show(first));
    state = reducer(state, actions.show(second));

    expect(state.current).not.toEqual(first);
  });

  it('does not hide a popover if it is not shown', () => {
    const first = 'COMMENTS_SUMMARY';
    const second = 'COMPARE_VERSIONS';

    let state;
    state = reducer(state, actions.show(first));
    state = reducer(state, actions.hide(second));

    expect(state.current).toEqual(first);
  });

  describe('selectPopoverIsVisible', () => {
    it('returns false by default', () => {
      expect(
        selectPopoverIsVisible({
          id: 'COMMENTS_SUMMARY',
          popover: initialState,
        }),
      ).toEqual(false);
    });

    it('returns true when shown', () => {
      const id = 'COMMENTS_SUMMARY';
      const popover = reducer(undefined, actions.show(id));

      expect(selectPopoverIsVisible({ id, popover })).toEqual(true);
    });

    it('returns false when not shown', () => {
      const id = 'COMMENTS_SUMMARY';
      const popover = reducer(undefined, actions.hide(id));

      expect(selectPopoverIsVisible({ id, popover })).toEqual(false);
    });
  });
});
