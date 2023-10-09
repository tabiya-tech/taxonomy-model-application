import userEvent from "@testing-library/user-event";
import { act } from "@testing-library/react";
import { UserEvent } from "@testing-library/user-event/setup/setup";

async function setup(callback: (user: UserEvent) => Promise<void>) {
  // We need to use fake times to ensure the debounce timer is progressed,
  // Since the debounce timer is called after the user stops typing, we need to set the fake timers
  // before the user begins typing, and for this reason we need to set up the userEvent to advance the timers using the jest timers,
  // so that the await user.type() can be resolved.
  // User enters a model name
  jest.useFakeTimers();
  const userEventFakeTimer = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  await callback(userEventFakeTimer);
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
}

export async function typeDebouncedInput(element: Element, text: string) {
  await setup(async (user) => {
    await user.type(element, text);
  });
}

export async function clickDebouncedButton(element: Element) {
  await setup(async (user) => {
    await user.click(element);
  });
}
