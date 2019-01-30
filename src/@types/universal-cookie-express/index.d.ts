/* eslint amo/only-tsx-files: 0 */
import { Request } from 'express';
import Cookies from 'universal-cookie';

declare module 'universal-cookie-express' {
  interface RequestWithCookies extends Request {
    universalCookies: Cookies;
  }
}
