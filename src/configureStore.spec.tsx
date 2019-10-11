import { actionToSentryBreadcrumb } from './configureStore';

describe(__filename, () => {
  describe('actionToSentryBreadcrumb', () => {
    const anyAction = ({ type = 'ANY', ...props }) => {
      return { type, ...props };
    };

    it('converts an action without a payload', () => {
      const type = 'SOME_ACTION';
      const someOtherThing = 'who knows';
      expect(
        actionToSentryBreadcrumb(anyAction({ type, someOtherThing })),
      ).toEqual({
        payload: undefined,
        type,
        someOtherThing,
      });
    });

    it('ignores a non-payload, object property', () => {
      expect(
        actionToSentryBreadcrumb({ type: 'ANY', wat: { unknown: 'object' } }),
      ).toMatchObject({ wat: '[type: object]' });
    });

    it.each(['string', 1, 0, true, null, undefined])(
      'handles an action with simple payload attribute "%s"',
      (value) => {
        expect(
          actionToSentryBreadcrumb(anyAction({ payload: { key: value } })),
        ).toMatchObject({
          payload: { key: value },
        });
      },
    );

    it.each([{}, new Set([])])(
      'handles an action with complex payload attribute "%s"',
      (value) => {
        expect(
          actionToSentryBreadcrumb(anyAction({ payload: { key: value } })),
        ).toMatchObject({
          payload: { key: `[type: ${typeof value}]` },
        });
      },
    );

    // Arrays have a special meaning within it.each() so it needs to be
    // defined as a separate test.
    it('handles an action with array payload attribute', () => {
      expect(
        actionToSentryBreadcrumb(anyAction({ payload: { key: [] } })),
      ).toMatchObject({
        payload: { key: '[type: object]' },
      });
    });
  });
});
