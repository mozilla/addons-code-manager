/* eslint-disable @typescript-eslint/camelcase */
import {
  ExternalChange,
  ExternalHunk,
  createInternalDiff,
} from '../../reducers/versions';
import { fakeExternalDiff, fakeVersionWithDiff } from '../../test-helpers';
import { ForwardComparisonMap } from './utils';

describe(__filename, () => {
  const createFakeExternalChange = (
    change: Partial<ExternalChange>,
  ): ExternalChange => {
    return {
      ...fakeExternalDiff.hunks[0].changes[0],
      ...change,
    };
  };

  const newForwardComparisonMap = ({
    changes = fakeExternalDiff.hunks[0].changes,
    hunks = [
      {
        ...fakeExternalDiff.hunks[0],
        changes,
      },
    ],
  }: {
    changes?: ExternalChange[];
    hunks?: ExternalHunk[];
  } = {}) => {
    const fakeVersion = {
      ...fakeVersionWithDiff,
      file: {
        ...fakeVersionWithDiff.file,
        diff: {
          ...fakeExternalDiff,
          hunks,
        },
      },
    };

    const diffInfo = createInternalDiff({
      baseVersionId: 1,
      headVersionId: 2,
      version: fakeVersion,
    });
    if (!diffInfo) {
      throw new Error('diffInfo was unexpectedly empty');
    }

    return new ForwardComparisonMap(diffInfo);
  };

  describe('ForwardComparisonMap', () => {
    it('maps normal changes', () => {
      const change = createFakeExternalChange({
        old_line_number: 1,
        new_line_number: 1,
        type: 'normal',
      });

      expect(
        newForwardComparisonMap({ changes: [change] }).getCodeLineAnchor(1),
      ).toEqual('#N1');
    });

    it('maps delete changes', () => {
      const change = createFakeExternalChange({
        old_line_number: 2,
        new_line_number: -1,
        type: 'delete',
      });

      expect(
        newForwardComparisonMap({ changes: [change] }).getCodeLineAnchor(2),
      ).toEqual('#D2');
    });

    it('maps insert changes', () => {
      const change = createFakeExternalChange({
        old_line_number: -1,
        new_line_number: 2,
        type: 'insert',
      });

      expect(
        newForwardComparisonMap({ changes: [change] }).getCodeLineAnchor(2),
      ).toEqual('#I2');
    });

    it('merges changes', () => {
      const changes = [
        createFakeExternalChange({
          old_line_number: 1,
          new_line_number: 1,
          type: 'normal',
        }),
        createFakeExternalChange({
          old_line_number: -1,
          new_line_number: 2,
          type: 'insert',
        }),
      ];

      const map = newForwardComparisonMap({ changes });
      expect(map.getCodeLineAnchor(1)).toEqual('#N1');
      expect(map.getCodeLineAnchor(2)).toEqual('#I2');
    });

    it('merges changes for all hunks', () => {
      const hunks = [
        {
          ...fakeExternalDiff.hunks[0],
          changes: [
            createFakeExternalChange({
              old_line_number: 1,
              new_line_number: 1,
              type: 'normal',
            }),
          ],
        },
        {
          ...fakeExternalDiff.hunks[0],
          changes: [
            createFakeExternalChange({
              old_line_number: -1,
              new_line_number: 2,
              type: 'insert',
            }),
          ],
        },
      ];

      const map = newForwardComparisonMap({ hunks });
      expect(map.getCodeLineAnchor(1)).toEqual('#N1');
      expect(map.getCodeLineAnchor(2)).toEqual('#I2');
    });

    it('favors inserts', () => {
      const changes = [
        createFakeExternalChange({
          old_line_number: 2,
          new_line_number: -1,
          type: 'delete',
        }),
        createFakeExternalChange({
          old_line_number: -1,
          new_line_number: 2,
          type: 'insert',
        }),
        createFakeExternalChange({
          old_line_number: 2,
          new_line_number: 2,
          type: 'normal',
        }),
      ];

      expect(newForwardComparisonMap({ changes }).getCodeLineAnchor(2)).toEqual(
        '#I2',
      );
    });

    it('favors normal lines over deletes', () => {
      const changes = [
        createFakeExternalChange({
          old_line_number: 1,
          new_line_number: 1,
          type: 'normal',
        }),
        createFakeExternalChange({
          old_line_number: 1,
          new_line_number: -1,
          type: 'delete',
        }),
      ];

      expect(newForwardComparisonMap({ changes }).getCodeLineAnchor(1)).toEqual(
        '#N1',
      );
    });

    it('handles unknown lines', () => {
      const changes = [
        createFakeExternalChange({
          old_line_number: 1,
          new_line_number: 1,
          type: 'normal',
        }),
      ];

      expect(newForwardComparisonMap({ changes }).getCodeLineAnchor(2)).toEqual(
        '',
      );
    });
  });
});
