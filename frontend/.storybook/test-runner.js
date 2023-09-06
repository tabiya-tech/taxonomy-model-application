const {getStoryContext} = require('@storybook/test-runner');
const {injectAxe, checkA11y, configureAxe, getViolations, reportViolations} = require('axe-playwright');
const TerminalReporterV2 = require("axe-playwright/dist/reporter/terminalReporterV2").default;

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

    // Fail on WCAG2A rules
    await checkA11y(page, "#storybook-root", {
      detailedReport: true,
      detailedReportOptions: {
        html: false,
      },
      verbose: false,
      axeOptions: {runOnly: ['wcag2a']},
    }, false, 'v2');

    // Warn for WCAG2AA, WCAG2AAA rules
    await checkA11y(page, "#storybook-root", {
      detailedReport: true,
      detailedReportOptions: {
        html: false,
      },
      verbose: false,
      axeOptions: {runOnly: ['wcag2aa', 'wcag2aaa']},
    }, true, 'default');
  },
};

