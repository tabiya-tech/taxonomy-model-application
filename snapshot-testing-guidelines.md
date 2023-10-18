## Snapshot Testing Fundamentals

At [Tabiya](https://tabiya.tech), we follow these guidelines for snapshot testing, to ensure the stability and maintainability of our components.

## **Snapshot Assurance**

- Perform snapshot testing only when you are confident that the component's behavior and appearance are stable.

## **Global State Independence**

- Ensure that global states or settings, such as global configuration or button clicks, do not affect the component's
snapshots. Snapshots should only capture the component itself, not external factors.

## **Minimal CSS Changes**

- Avoid using CSS changes to fix snapshot test failures. Instead, focus on addressing the root cause of the problem
  within the component or its test.

## **Test Scope**

- Snapshot test only the parts of the component that are critical to its functionality. Avoid capturing non-essential or
  dynamic content.

## **Snapshot Maintenance**
- Ensure snapshots tests are updated when you made new changes to the components.

By following these guidelines, we ensure that our snapshot tests contribute to the overall quality and stability of our
components while minimizing potential issues and maintenance challenges.

