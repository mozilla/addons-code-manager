import refractor from 'refractor';

import text from './text-language';
import './prism.css';

// This is needed to provide a fallback in `getLanguage()` when the mime type
// has no corresponding syntax highlighting language.
refractor.register(text);

export default refractor;
