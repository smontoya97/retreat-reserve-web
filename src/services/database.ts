/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class LocalDatabase {
  static getLoggedInUser(): null {
    return null;
  }

  static logoutUser(): void {
    // No-op: the app now relies on the backend session.
  }

  static getEmails(): [] {
    return [];
  }

  static clearEmails(): void {
    // No-op: email simulation was removed.
  }
}
