# Style Guide

## Design System: Modern Structural / Web Brutalist

### Visual Language

- Clean digital report / modern archival interface
- High contrast, black on white by default
- 3-color palette: White, Black, and Light Gray

### Core Rules

#### Color Palette

The design system uses exactly **3 colors**:

| Color                   | Hex       | Tailwind                                          | Usage                                                                        |
| ----------------------- | --------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| **White (Base)**        | `#FFFFFF` | `bg-white`, `text-white`                          | Page backgrounds, card backgrounds, button text on hover                     |
| **Black (Contrast)**    | `#000000` | `bg-black`, `text-black`, `border-black`          | Text, borders, icons, hover backgrounds                                      |
| **Light Gray (Accent)** | `#E5E5E5` | `bg-gray-200`, `text-gray-200`, `border-gray-200` | Disabled states, secondary backgrounds, subtle separators, inactive elements |

#### Color Usage Rules

**White:**

- Primary background color for pages and containers
- Text color for inverted states (black backgrounds)
- Default state for interactive elements

**Black:**

- Primary text color
- All borders (1px solid black)
- Hover state backgrounds (with white text)
- Icons and visual emphasis

**Light Gray:**

- Secondary/tertiary backgrounds (e.g., table headers, disabled inputs)
- Disabled state backgrounds or borders
- Subtle separators when black is too strong
- Inactive or non-interactive elements
- **Do not use for primary text** (fails contrast requirements)

#### Borders

- **Always 1px solid black** (`border border-black`)
- Used for: outlines, separators, containers, input fields, buttons

#### Prohibited Styles

- ❌ No `border-radius` (enforced globally in `main.css`)
- ❌ No `box-shadow` (enforced globally in `main.css`)
- ❌ No gradients
- ❌ No rounded corners
- ❌ No drop shadows

### Typography System

#### Font Families

- **Body text**: Helvetica, Arial, sans-serif (set on `<body>`)
- **UI components**: Monospace (via `.ui-base` class)
- **Rule**: No mixed font stacks - components use one or the other

#### 4-Level Size Hierarchy

The project uses **exactly 4 text sizes**. No other sizes are permitted.

| Level   | Class      | Size            | Usage                                                    |
| ------- | ---------- | --------------- | -------------------------------------------------------- |
| **XS**  | `text-xs`  | 0.75rem / 12px  | Labels, auxiliary info, table headers, button text       |
| **SM**  | `text-sm`  | 0.875rem / 14px | Body text, descriptions, table content, navigation links |
| **LG**  | `text-lg`  | 1.125rem / 18px | Section titles (e.g., drawer headers)                    |
| **2XL** | `text-2xl` | 1.5rem / 24px   | Page main titles (Login, Dashboard, Ledger)              |

#### Text Modifiers

**XS Level Only:**

- Always use with `uppercase tracking-widest` for labels
- Examples: form labels, table headers, button text

**Heading Levels:**

- Always use `font-semibold` with LG and 2XL
- Combine with `uppercase tracking-widest` for emphasis

**Body Text:**

- SM level is default for paragraphs and descriptions
- Can use `text-black/70` for secondary information

#### Migration Mapping

When updating existing code:

- `text-xs` → Keep as `text-xs`
- `text-sm` → Keep as `text-sm`
- `text-base` → Change to `text-sm`
- `text-xl` → Change to `text-lg`
- `text-2xl` → Keep as `text-2xl`
- `text-3xl` → Change to `text-2xl`

### Layout & Spacing

#### Containers

- Use `border border-black` for all containers
- Padding: `p-4`, `p-6`, `p-8` (consistent with 4px grid)
- Background colors: White (default), Light Gray (`bg-gray-200`) for secondary surfaces

#### Spacing Scale

- Follow Tailwind's spacing scale (0.25rem increments)
- Common values: `gap-2`, `gap-4`, `space-y-2`, `space-y-4`

### Component Styling

#### Shared Base Class

```css
.ui-base {
  @apply border border-black bg-white font-mono text-black;
}
```

Applied to: buttons, inputs, selects, textareas

#### Interactive States

**Hover:**

- Buttons: `hover:bg-black hover:text-white`
- Links: `hover:underline` or inverse colors

**Disabled:**

- Background: Light gray (`disabled:bg-gray-200`)
- Opacity: `disabled:opacity-50` (alternative approach)
- Cursor: `disabled:cursor-not-allowed`
- Prevent hover: `disabled:hover:bg-gray-200 disabled:hover:text-black`

**Focus:**

- Use default browser focus indicators (respects accessibility)
- Can enhance with `focus:outline-2 focus:outline-black`

### Tailwind-Only Rule

- **All styling must use Tailwind utilities**
- Exception: Global resets and `.ui-base` in `main.css`
- No custom CSS in components
- No inline styles except for dynamic values (rare)

### CSS Reset Notes

The `main.css` includes critical resets:

```css
/* Enforce no rounding or shadows globally */
* {
  border-radius: 0;
  box-shadow: none;
}

/* Form elements inherit color but NOT font */
input,
select,
textarea {
  font: inherit; /* Inherits body Helvetica */
  color: inherit;
}

button {
  color: inherit; /* NO font: inherit - lets component control typography */
}
```

**Important:** Buttons do NOT use `font: inherit` because the Button component manages its own typography (monospace, text-xs, etc.). The `font: inherit` shorthand would override Tailwind classes.

### Component Design Philosophy

1. **Component owns its styling** - Not the caller
2. **Fixed dimensions for interactive elements** - e.g., `h-10` for buttons
3. **Default typography in component** - Callers only add layout classes
4. **Consistent spacing** - Use the same padding/height across similar components

### Examples

#### Button (Good)

```vue
<!-- Component defines: text-xs uppercase tracking-widest -->
<Button text="Submit" class="w-full" />
```

#### Button States (Good)

```vue
<!-- Default: white bg, black text, black border -->
<!-- Hover: black bg, white text -->
<!-- Disabled: gray bg, black text, no hover effect -->
<Button text="Save" :disabled="isLoading" />
```

#### Form Field (Good)

```vue
<label class="text-xs uppercase tracking-widest">Username</label>
<input class="ui-base w-full px-3 py-2" />
```

#### Secondary Background (Good)

```vue
<!-- Use light gray for table headers or secondary surfaces -->
<thead class="bg-gray-200">
  <tr>
    <th class="border border-black px-4 py-2 text-xs uppercase tracking-widest">Date</th>
  </tr>
</thead>
```

#### Page Title (Good)

```vue
<h1 class="text-2xl font-semibold uppercase tracking-widest">Dashboard</h1>
```

#### Section Header (Good)

```vue
<h2 class="text-lg font-semibold uppercase tracking-widest">Settings</h2>
```

#### Body Text (Good)

```vue
<p class="text-sm text-black/70">Enter your account credentials to continue.</p>
```

### Checklist for New Components

- [ ] Uses only xs/sm/lg/2xl text sizes
- [ ] Has `ui-base` class if it's an interactive element
- [ ] Has 1px black border
- [ ] Has NO border-radius
- [ ] Has NO box-shadow
- [ ] Uses only white/black/gray-200 colors
- [ ] Defines its own typography (doesn't rely on caller)
- [ ] Uses Tailwind utilities only (no custom CSS)
- [ ] Has proper hover/disabled states (gray-200 for disabled)
- [ ] Documented in `docs/components/`
