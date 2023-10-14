# UI Styling Guidelines
At [Tabiya](https://tabiya.tech/), we follow these UI guidelines to ensure consistency and maintainability in our project's user interface.

Additionally, we have a [Styles Story in Storybook](src/theme/applicationTheme.stories.tsx) to visualize our palette and provide visual guidance for selecting the appropriate style elements. 

For further guidance, refer to the [Material Design System v2](https://m2.material.io/).

## Typography
- When displaying text in the UI, we use typography elements (e.g. `h1`, `body1`) without specifying specific font properties to maintain flexibility

```
<Typography variant="h1"> Some text </Typography>
```

## Colors

- We only use colors from the defined theme in the UI.

```
<Box bgcolor={"tabiyaGreen.main"}/>
```

> **Note:**
The contrast text has been calculated for each main color variant with the WCAG 2 AA minimum contrast ratio thresholds in mind (4.5:1). In many cases the contrast text will work for the light and dark variant of that color. However, as this is not guaranteed, when displaying text over lighter ir darker variants of a color, it is recommended to check for and use` getContrastText()` function to ensure the correct contrast text is used.

## Layout and Spacing
- Higher-Order Components (HOCs) manage padding, spacing, and layout for their child components
- Control of the layout flows in one direction, from parent to child. Sibling components should not care about the layout of neighboring components.
- When defining spacing options like margins or padding or flex gaps we use the predefined keys from the `tabiyaSpacing` in the application theme. Likewise, when defining rounding options like border radius we use the predefined keys from the `tabiyaRounding` in the application theme. We avoid using arbitrary pixel values (px).

```
const theme = useTheme();

<Box padding={theme.tabiyaSpacing.md} borderRadius={theme.tabiyaRounding.sm}>
  <ChildComponent1 />
  <ChildComponent2 />
</Box>
```
## Icon Sizes
- We use the standard icon sizes specified in the palette to ensure consistency.
```
<SomeIcon fontSize="small" />
```
## Accessibility
- We prioritize accessibility, ensuring that all components are usable by everyone.
- Complying to WAG 2.0 A rules is **mandatory**.
- Complying to WAG 2.0 AA and WAG 2.0 AAA rules is optional.


We do not deviate from the above guidelines unless there is a valid reason to do so. In such cases, it is essential to question whether the guidelines should be extended to encompass the specific case that prompted the deviation.