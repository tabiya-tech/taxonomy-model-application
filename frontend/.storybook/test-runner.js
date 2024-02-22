const { getStoryContext } = require("@storybook/test-runner");
const { injectAxe, checkA11y, configureAxe } = require("axe-playwright");

module.exports = {
  async preRender(page) {
    await injectAxe(page);
  },
  async postRender(page, context) {
    // Get entire context of a story, including parameters, args, argTypes, etc.
    const storyContext = await getStoryContext(page, context);

    // Do not test a11y for stories that disable a11y
    if (storyContext.parameters?.a11y?.disable) {
      return;
    }

    // Apply story-level a11y rules
    await configureAxe(page, {
      rules: storyContext.parameters?.a11y?.config?.rules,
    });
    // See comments in the preview.js file for more details on the rootElement selector
    const rootElement = '#storybook-root:not([aria-hidden="true"]), body > div[role="presentation"]';
    // Fail on WCAG2A rules
    // https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
    await checkA11y(
      page,
      rootElement,
      {
        detailedReport: true,
        detailedReportOptions: {
          html: false,
        },
        verbose: false,
        axeOptions: { runOnly: ["wcag2a"] },
      },
      false,
      "v2"
    );

    // Warn for WCAG2AA, WCAG2AAA rules, and Best Practice Rules
    // https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
    await checkA11y(
      page,
      "#storybook-root",
      {
        detailedReport: true,
        detailedReportOptions: {
          html: false,
        },
        verbose: false,
        axeOptions: { runOnly: ["wcag2aa", "wcag2aaa", "best-practice"] },
      },
      true,
      "default"
    );
  },
};
