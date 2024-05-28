# UI Styling Guidelines

At [Tabiya](https://tabiya.tech/), we follow these UI guidelines to ensure consistency and maintainability in our
project's user interface.

Additionally, we have a [Styles Stories in Storybook](src/theme/applicationTheme) to visualize various aspects
of our style and provide visual guidance for selecting the appropriate styling for elements.

For further guidance, refer to the [Material Design System v2](https://m2.material.io/).

> **Note:**
> In principle, we do not deviate from the bellow guidelines unless there is a valid reason to do so. In such cases, it
> is
> essential to question whether the guidelines should be extended to encompass the specific case that prompted the
> deviation.

## Accessibility

We prioritize accessibility, ensuring that all components are usable by everyone.

- Complying to WAG 2.0 A rules is **mandatory**.
- Complying to WAG 2.0 AA rules is **recommended** but optional.
- Complying to WAG 2.0 AAA rules is entirely optional.
- Complying to Best Practice Rules is
  entirely optional.

See '[Rule Descriptions](https://www.deque.com/axe/core-documentation/api-documentation/#axe-core-tags)' for more information on the rules.

> **Note:**
Accessibility testing is conducted with [storybook-addon-a11y](https://storybook.js.org/addons/@storybook/addon-a11y). Please note that specifying a DOM element for testing is necessary, and there's a slight possibility of the tests not selecting the correct element and reporting a false positive. For more details, refer to the [](.storybook/preview.tsx) and [](.storybook/test-runner.js) files in the folder. If your component requires a different selector, see [how to configure the tests](https://storybook.js.org/docs/writing-tests/accessibility-testing#configure) at the component or story level.
> 

## Typography

When displaying text in the UI, we use typography elements (e.g. `h1`, `body1`) without specifying specific font
properties to maintain flexibility

```typescript jsx 
<Typography variant="h1"> Some text </Typography>

// if you must specify font properties explicitly, then refer to the theme
<p sx={{fontFamily: (theme) => theme.typography.h1.fontFamily}}> Some text </p>
```

The typography elements are all defined with responsive font sizes. This means that the font size will automatically
adjust as the viewport size changes. It provides flexibility in adapting to different screen sizes without the need for
explicit adjustments.

## Colors

We only use colors from the defined theme in the UI.

```typescript jsx 
// both of these are equivalent
<Box bgcolor={"tabiyaGreen.main"}/>
<Box bgcolor={theme.palette.tabiyaGreen.main}
```

> **Note:**
> The contrast text has been calculated for each main color variant with the WCAG 2 AA minimum contrast ratio thresholds
> in mind (4.5:1). In many cases the contrast text will work for the light and dark variant of that color. However, as
> this is not guaranteed, when displaying text over lighter or darker variants of a color, it is recommended to check
> for
> and use` getContrastText()` function to ensure the correct contrast text is used.

## Layout and Spacing

Here are some general guidelines for layout and spacing:

- Higher-order Components (HOCs) manage padding, spacing, and layout for their child components
- Control of the layout flows in one direction, from parent to child. Sibling components should not care about the
  layout of neighboring components.
- When defining spacing options like margins or padding or flex gaps we use the predefined keys from the `tabiyaSpacing`
  in the application theme. Likewise, when defining rounding options like border radius we use the predefined keys from
  the `tabiyaRounding` in the application theme. We avoid using arbitrary values (px, rem or unit-less).

```typescript jsx
const theme = useTheme();

<Box padding={theme.tabiyaSpacing.md} borderRadius={theme.tabiyaRounding.sm}>
    <ChildComponent1/>
    <ChildComponent2/>
</Box>
```

### Responsive and Non-Responsive Spacing and Rounding

#### Responsive Spacing

The spacing in our design system is inherently responsive. This means that the spacing automatically adjusts as the
viewport size changes. It provides flexibility in adapting to different screen sizes without the need for explicit
adjustments.

```typescript jsx
// both of these are equivalent
<Box padding={theme.tabiyaSpacing.md}/>
<Box padding={theme.spacing(theme.tabiyaSpacing.md)}/>
```

#### Fixed (Non-Responsive) Spacing

When you want to make your spacing fixed, you define that explicitly by using the `fixedSpacing()` function.

```typescript jsx
<Box padding={theme.fixedSpacing(theme.tabiyaSpacing.md)}/>
```

#### Fixed (Non-Responsive) Rounding

On the other hand, rounding (border radius) is not inherently responsive by default.

```typescript jsx
// Both of these are equivalent
<Box borderRadius={theme.tabiyaRounding.sm}/>
<Box borderRadius={theme.rounding(theme.tabiyaRounding.sm)}/>
```

```typescript jsx
// When specifying the borderTopRightRadius, or any other specific border radius, you must explicitly use the rounding() function
<Box sx={{borderTopRightRadius: (theme) => theme.rounding(theme.tabiyaRounding.md)}}/>
```

#### Responsive Rounding

If you want to make the rounding responsive and adapt to different viewport sizes, you can use
the `responsiveBorderRounding()` function:

```typescript jsx
<Box borderRadius={theme.responsiveBorderRounding(theme.tabiyaRounding.sm)}/>

// or
<Box sx={{borderTopRightRadius: (theme) => theme.responsiveBorderRounding(theme.tabiyaRounding.md)}}/>
```

## Icon Sizes

We use the standard icon sizes specified in the palette to ensure consistency.

```typescript jsx
<SomeIcon fontSize="small"/>
```