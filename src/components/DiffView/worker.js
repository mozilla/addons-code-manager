/* eslint-disable amo/only-tsx-files */
import refractor from 'refractor';
import { tokenize } from 'react-diff-view';

export const doTokenize = (hunks, options) => {
  console.log('---- doTokenize has started...');
  const tokenizeOptions = { ...options, refractor };
  const tokens = tokenize(hunks, tokenizeOptions);
  postMessage(tokens);
  return true;
};
