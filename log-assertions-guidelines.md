# Guidelines for Log assertions

To ensure that rendering components do not cause unexpected errors and warnings, it is recommended to include
appropriate assertions during component rendering tests.

For example:

```typescript
// mute the console
import "src/_test_utilities/consoleMock";

import {render, screen} from "src/_test_utilities/test-utils";

describe("foo render tests", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  it("should be shown", () => {
    // WHEN <foo> is rendered
    render(<Foo / >);
    
    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });
});
```