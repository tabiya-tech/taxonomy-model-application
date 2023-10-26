import { fireEvent } from "@testing-library/react";

export function mockBrowserIsOnLine(isOnline: boolean) {
  if (window.navigator.onLine !== isOnline) {
    jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(isOnline);
    if (isOnline) {
      fireEvent.online(window);
    } else {
      fireEvent.offline(window);
    }
  }
}

export function unmockBrowserIsOnLine() {
  jest.spyOn(window.navigator, "onLine", "get").mockRestore();
}
