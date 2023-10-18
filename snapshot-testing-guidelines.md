# Snapshot Testing Fundamentals

At [Tabiya](https://tabiya.tech), we follow these guidelines for snapshot testing to ensure the stability and
maintainability of our components.

## Purpose of Snapshot Testing

Snapshot testing is performed to validate the correctness and consistency of our UI components. It works in
collaboration
with other tests to ensure that components are rendered accurately and without unexpected changes.

### Correctness

Snapshot tests ensure that our components are rendered correctly based on our assumptions. This is essential for
maintaining the quality and consistency of the UI.

- Verify that no console errors are logged during component rendering.
- Ensure that expected components are present in the document with the correct attributes.
- Generate snapshots only after visually confirming that the component renders correctly, both in storybook and in the
  browser.

### Consistency

Snapshot tests help maintain consistency in the rendering of our components. Consistency is crucial to ensure that our
UI remains reliable over time.

- If a snapshot test fails, investigate the nature of the change and determine whether it was intentional or
  unintentional.
- Update the snapshot if the change was intentional and reflects the new expected behavior. If the change was
  unintentional, address the issue accordingly.

## Common Pitfalls

Avoid the following common mistakes when performing snapshot testing:

### Timing of Testing

Perform snapshot testing only after finalizing the layout and styling of the component. Testing
too early may result in frequent snapshot updates as these aspects evolve.

### Dynamic Content

Snapshot testing is not suitable for dynamic content because it may result in frequent updates
and test failures. Use alternative testing approaches for dynamic content.

### Application Theme Changes

Consider the impact of application theme changes on snapshot testing. Application theme
changes cause the snapshot to fail in components where these changes are being used.
