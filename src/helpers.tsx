import { User } from './reducers/users';

export const fakeUser: User = Object.freeze({
  id: 1,
  name: 'Bob',
  email: 'bob@somewhere.com',
  permissions: ['a-fake-permission'],
});
