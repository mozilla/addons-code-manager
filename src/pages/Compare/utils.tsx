import log from 'loglevel';
import {
  ChangeInfo,
  ChangeType,
  DiffInfo,
  getChangeKey,
} from 'react-diff-view';

import { getAllHunkChanges } from '../../components/DiffView';

type ForwardChangeMap = {
  [line: string]: ChangeInfo[];
};

const appendChangesInPlace = (
  changeMap: ForwardChangeMap,
  line: string,
  change: ChangeInfo,
) => {
  // This destructively appends changes to the line's ChangeInfo array
  // (when it exists).
  // eslint-disable-next-line no-param-reassign
  changeMap[line] = changeMap[line] || [];
  changeMap[line].push(change);
};

// This is a map of an old vs. new file comparison, giving preference to the
// "forward" file, i.e. the newer file.
export class ForwardComparisonMap {
  private changeMap: ForwardChangeMap;

  constructor(diff: DiffInfo) {
    this.changeMap = {};
    for (const change of getAllHunkChanges(diff.hunks)) {
      appendChangesInPlace(
        this.changeMap,
        String(change.oldLineNumber),
        change,
      );
      appendChangesInPlace(
        this.changeMap,
        String(change.newLineNumber),
        change,
      );
    }

    const relevantTypes: ChangeType[] = ['insert', 'normal', 'delete'];

    // Sort changes per line, ordered by relevantTypes.
    Object.keys(this.changeMap).forEach((line) => {
      this.changeMap[line].sort((firstChange, secondChange) => {
        if (firstChange.type === secondChange.type) {
          return 0;
        }

        for (const type of relevantTypes) {
          if (firstChange.type === type) {
            return -1;
          }
          if (secondChange.type === type) {
            return 1;
          }
        }

        // This isn't possible but it needs to return a value to satisfy the
        // sort() interface
        /* istanbul ignore next */
        return 0;
      });
    });
  }

  createCodeLineAnchorGetter() {
    return this.getCodeLineAnchor.bind(this);
  }

  getCodeLineAnchor(line: number) {
    const lineChanges = this.changeMap[line];
    if (!lineChanges || lineChanges.length === 0) {
      log.warn(`No changes were mapped for line ${line}`);
      return '';
    }

    return `#${getChangeKey(lineChanges[0])}`;
  }
}
