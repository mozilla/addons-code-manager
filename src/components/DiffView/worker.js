/* eslint-disable amo/only-tsx-files */
import refractor from 'refractor';
import { tokenize } from 'react-diff-view';

import text from './text-language';
// import '../../refractor/prism.css';
// import '../../refractor/prism.overrides.scss';

export const doTokenize = (hunks, options) => {
  console.log('---- doTokenize has started...');
  // This is needed to provide a fallback in `getLanguage()` when the mime type
  // has no corresponding syntax highlighting language.
  refractor.register(text);
  const tokenizeOptions = { ...options, refractor };
  const tokens = tokenize(hunks, tokenizeOptions);
  console.log('---- tokenize has finished: ', tokens);
  postMessage(tokens);
  return true;
};
