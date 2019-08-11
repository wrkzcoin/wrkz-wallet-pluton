// @flow
export default class LoginCounter {
  userLoginAttempted: boolean;

  isLoggedIn: boolean;

  lastLoginAttemptFailed: boolean;

  loginsAttempted: number;

  constructor() {
    this.userLoginAttempted = false;
    this.isLoggedIn = false;
    this.lastLoginAttemptFailed = false;
    this.loginsAttempted = 0;
  }
}
