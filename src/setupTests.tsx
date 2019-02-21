import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { GlobalWithFetchMock } from 'jest-fetch-mock';
import 'jest-enzyme';

import './jest-matchers';

configure({ adapter: new Adapter() });

// See: https://github.com/jefflau/jest-fetch-mock/tree/07cf149688b6738e0a45864626ba47793d04da23#typescript-guide
const customGlobal: GlobalWithFetchMock = global as GlobalWithFetchMock;

customGlobal.fetch = require('jest-fetch-mock');

customGlobal.fetchMock = customGlobal.fetch;

beforeEach(() => {
  customGlobal.fetchMock.resetMocks();
});
