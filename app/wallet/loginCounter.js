// @flow
export default class LoginCounter {
  userLoginAttempted: boolean;

  isLoggedIn: boolean;

  constructor() {
    this.userLoginAttempted = false;
    this.isLoggedIn = false;
  }
}
