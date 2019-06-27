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

const mergeChanges = (
  changeMap: ForwardChangeMap,
  line: string,
  change: ChangeInfo,
) => {
  const lineChanges = changeMap[line] || [];
  lineChanges.push(change);
  return lineChanges;
};

// This is a map of an old vs. new file comparison, giving preference to the
// "forward" file, i.e. the newer file.
export default class ForwardComparisonMap {
  private changeMap: ForwardChangeMap;

  constructor(diff: DiffInfo) {
    this.changeMap = getAllHunkChanges(diff.hunks).reduce((all, change) => {
      return {
        ...all,
        [String(change.oldLineNumber)]: mergeChanges(
          all,
          String(change.oldLineNumber),
          change,
        ),
        [String(change.newLineNumber)]: mergeChanges(
          all,
          String(change.newLineNumber),
          change,
        ),
      };
    }, {});

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
