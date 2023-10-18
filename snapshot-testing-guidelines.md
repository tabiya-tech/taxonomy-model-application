# Snapshot Testing Fundamentals

We recommend snapshot testing for components, to verify their stability, correct rending, and avoid unexpected changes.

A snapshot should be considered valid only when the component has been visually inspected and verified that it renders correctly, both in storybook and in the browser.

If a snapshot test fails, investigate the nature of the change and determine whether it was intentional or not. 

Update the snapshot if the change was intentional and reflects the new expected behavior. If the change was  unintentional, address the change appropriately.

## Common Pitfalls

Here are some common mistakes when performing snapshot testing.

### Timing of Testing

Perform snapshot testing only after finalizing the layout and styling of the component. Testing
too early may result in frequent snapshot updates as these aspects evolve.

### Dynamic Content

Snapshot testing is not suitable for dynamic content because it may result in frequent updates
and test failures. Use alternative testing approaches for dynamic content.

### Application Theme Changes

Consider the impact of application theme changes on snapshot testing. Application theme
changes cause the snapshot to fail in components where these changes are being used.
