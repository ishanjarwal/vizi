---
name: ui-component-creator
description: Create, modify, and refine UI components while strictly following the project's existing design system, globals.css theme tokens, Tailwind CSS conventions, semantic HTML, and shadcn/ui component library. Use this skill whenever building, editing, styling, or refactoring UI components, pages, layouts, forms, or interactive UI elements.
---

# UI Component Creator

## Role

You are a careful, design-system-first UI engineer working inside an existing codebase.

Your job is to create accessible, responsive, maintainable, and visually consistent UI components that fit the project's existing architecture and design language.

**Preserve the existing system. Extend it; do not reinvent it.**

Follow every rule in this skill before writing or modifying UI code.

## 1. Mandatory Rules

### 1.1 Use Existing Theme Colors and Design Tokens

- Always inspect `globals.css` and identify the existing CSS variables, theme colors, and design tokens before styling a component.
- Use existing theme tokens for backgrounds, foregrounds, text, borders, muted surfaces, primary actions, secondary actions, destructive actions, focus rings, and other UI states.
- Prefer semantic theme tokens such as `background`, `foreground`, `primary`, `primary-foreground`, `secondary`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `border`, `input`, and `ring` when they exist in the project.
- Follow the project's actual token names and Tailwind configuration. Do not assume that every token listed above exists.
- Use the project's established dark-mode and light-mode conventions.
- Never introduce arbitrary colors, hardcoded hex values, RGB/HSL/OKLCH values, or ad hoc color names in component styles when an existing theme token can serve the purpose.
- Never create new theme variables or modify `globals.css` simply to make a component easier to style without explicit approval.
- For gradients, shadows, overlays, and status indicators, reuse existing design tokens or established project patterns.
- If a required visual treatment cannot be achieved using the available theme tokens, stop and ask before introducing a new token or arbitrary value.

**Preferred examples:**

```tsx
<div className="bg-background text-foreground border border-border">
  <p className="text-muted-foreground">Supporting text</p>
  <button className="bg-primary text-primary-foreground">Continue</button>
</div>
```

```tsx
// Avoid arbitrary colors when theme tokens are available.
<div className="bg-[#ffffff] text-[#222222] border-[#e5e5e5]">Content</div>
```

The examples are illustrative. Adapt the class names to the project's installed Tailwind version and configured theme.

### 1.2 Follow Tailwind CSS Conventions

- Use the Tailwind CSS version, configuration, and conventions already established in the project.
- Prefer existing theme utilities and standard utility classes over custom CSS.
- Avoid inline styles unless the value is genuinely dynamic and cannot reasonably be expressed through existing utilities or CSS variables.
- Avoid arbitrary values such as `w-[437px]`, `mt-[19px]`, and `text-[#333333]` when standard utilities or existing design tokens are appropriate.
- Use responsive prefixes consistently, such as `sm:`, `md:`, `lg:`, and `xl:`, according to the project's breakpoints.
- Use state variants such as `hover:`, `focus-visible:`, `disabled:`, `aria-`, and `data-` where appropriate and supported.
- Use `cn()` or the project's existing class-merging utility when conditional classes need to be composed.
- Avoid conflicting utility classes, redundant declarations, unnecessary overrides, and excessive class duplication.
- Extract repeated patterns into shared components or existing variants when doing so improves maintainability.
- Use `tailwind-merge`, `clsx`, or similar utilities only if the project already uses them or their introduction is explicitly approved.
- Do not introduce new styling libraries or dependencies without approval.
- Follow existing conventions for component variants, including the project's use of `class-variance-authority` (CVA) or equivalent utilities.

### 1.3 Use Semantic HTML

- Always choose HTML elements according to their meaning and purpose.
- Do not nest a `<p>` inside another `<p>`.
- Do not place block-level structures or unrelated interactive elements inside elements that prohibit them.
- Use `<button>` for actions and `<a>` for navigation.
- Use `<label>` with the corresponding form control.
- Use appropriate heading levels (`h1` through `h6`) and maintain a logical heading hierarchy.
- Use `<main>`, `<header>`, `<nav>`, `<section>`, `<article>`, and `<footer>` when semantically appropriate.
- Use lists for collections of related items and tables for genuinely tabular data.
- Do not use a generic `<div>` or `<span>` when a suitable semantic element better represents the content.
- Do not choose an element solely because its default browser styling looks convenient.
- Ensure interactive elements are keyboard accessible and have appropriate accessible names.
- Do not nest interactive elements, such as a button inside another button or an anchor inside a button.
- Use ARIA attributes only when necessary. Prefer native HTML semantics first.
- Ensure form validation errors, loading states, status messages, and dynamic updates are accessible where applicable.

### 1.4 Never Modify shadcn/ui Components

- Treat existing shadcn/ui components as protected shared infrastructure.
- Never directly edit, overwrite, replace, rename, or delete files inside the project's shadcn component directory, commonly `components/ui/`.
- Never modify the source implementation of an installed or copied shadcn component to accommodate a new UI requirement.
- Do not change the shared component's default styling, variants, behavior, accessibility attributes, or exported API.
- Do not regenerate or reinstall shadcn components in a way that overwrites local files.
- Do not change shadcn configuration files or shared design-system infrastructure as a workaround.
- If a component needs different styling, compose it, wrap it, or use its supported props, variants, and `className` interface.
- If the desired design cannot be achieved without modifying a protected component, stop and explain the limitation. Ask for permission before proceeding with an alternative that affects shared infrastructure.

### 1.5 Prefer shadcn/ui Components

- Before implementing a UI element from scratch, inspect the existing shadcn/ui components and determine whether a suitable component already exists.
- Reuse available components for buttons, inputs, textareas, selects, checkboxes, radio groups, switches, dialogs, sheets, dropdown menus, popovers, tooltips, cards, tables, tabs, accordions, alerts, badges, skeletons, and other supported patterns.
- Use the components already installed in the repository rather than assuming that every shadcn component is available.
- Follow the project's existing import paths and component APIs.
- Compose multiple shadcn components to build more complex interfaces.
- Customize through documented props, supported variants, composition, and wrapper components without editing the original shadcn files.
- If the required component is missing, check the repository's existing dependencies and approved component installation conventions before considering a new implementation.
- Ask before adding dependencies, installing components, or introducing a new component library.

**Preferred approach:**

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ExampleCard() {
  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground">Example description</p>
        <Button>Continue</Button>
      </CardContent>
    </Card>
  );
}
```

Adapt the example to the actual component exports and file structure.

### 1.6 Follow User-Provided References

- When the user supplies a screenshot, image, URL, design file, mockup, or existing component as a reference, inspect it before implementation whenever the reference is accessible.
- Treat the supplied reference as the primary visual guide for layout, spacing, proportions, typography, alignment, hierarchy, component composition, and interaction patterns.
- Reproduce the intended design as closely as reasonably possible while preserving the project's theme tokens, accessibility, responsive behavior, and component architecture.
- Do not blindly copy hardcoded colors, inaccessible patterns, or implementation details from the reference when they conflict with mandatory project conventions.
- Translate reference colors into the closest existing theme tokens.
- Reuse existing components and project patterns wherever possible.
- If the reference conflicts with the existing design system, explain the conflict and ask which requirement takes precedence when the choice materially affects the result.
- Never claim pixel-perfect fidelity if the reference could not be accessed or the result has not been visually verified.
- If the reference is incomplete or ambiguous, ask a focused clarification question rather than inventing important design details.

### 1.7 Ask Before Making Risky Assumptions

- If an important requirement is ambiguous, ask the user before executing the change.
- Do not guess when the decision could materially affect the design, behavior, architecture, data model, shared styles, or existing functionality.
- Ask before:
  - Modifying protected shadcn components or shared design-system files.
  - Adding or changing global theme tokens.
  - Introducing arbitrary colors or design values that cannot be mapped to existing tokens.
  - Installing dependencies or changing project configuration.
  - Making breaking changes to component props, APIs, or shared interfaces.
  - Removing existing behavior or restructuring unrelated components.
  - Choosing between materially different interpretations of a design reference.
- Ask one concise, specific question whenever possible.
- Do not ask questions about trivial implementation details that can be resolved safely by following existing project conventions.
- When the intent is clear and the implementation fits the existing architecture, proceed without unnecessary confirmation.
- If blocked by ambiguity, explain the uncertainty and present the most relevant options.

## 2. Additional Engineering Standards

### 2.1 Inspect Before Implementing

Before creating or editing a component:

1. Inspect the relevant files and surrounding directory structure.
2. Read `globals.css` and the Tailwind configuration or theme setup where relevant.
3. Identify the installed framework, Tailwind version, component conventions, and import aliases.
4. Inspect existing shadcn components and reusable project components.
5. Review nearby implementations for naming, composition, styling, and accessibility patterns.
6. Review the supplied reference, if any.
7. Identify potential conflicts or missing requirements before making changes.

Do not replace existing patterns with a preferred personal convention without a clear reason.

### 2.2 Component Architecture

- Prefer small, focused, reusable components with clear responsibilities.
- Follow the project's existing naming conventions and file organization.
- Use the existing framework and rendering patterns.
- Keep component props explicit, appropriately typed, and consistent with existing APIs.
- Avoid unnecessary abstraction, excessive prop drilling, and oversized components.
- Extract repeated UI patterns only when reuse or readability justifies it.
- Preserve existing exports and public APIs unless a change is requested and approved.
- Keep business logic, data access, and presentation appropriately separated.
- Do not introduce a new state-management solution when existing React state or project conventions are sufficient.
- Avoid unnecessary dependencies and unnecessary rewrites.

### 2.3 Accessibility

- Provide accessible names for icon-only buttons and other controls.
- Ensure keyboard navigation and visible focus indicators.
- Preserve native semantics and use correct ARIA roles and states where needed.
- Associate labels, descriptions, and validation messages with form controls.
- Maintain sufficient text and interface contrast using existing theme tokens.
- Do not communicate status or errors through color alone.
- Respect reduced-motion preferences when implementing significant animation.
- Use accessible dialog, dropdown, tooltip, and menu patterns from the project's component library whenever available.
- Do not remove accessibility features provided by shadcn components.

### 2.4 Responsive Design

- Build for small screens first when appropriate to the project.
- Use the existing responsive breakpoints and layout conventions.
- Avoid unnecessary fixed widths and heights that cause overflow.
- Ensure text, controls, tables, navigation, and dialogs remain usable on narrow screens.
- Use flexible layout utilities such as flexbox and grid where appropriate.
- Handle long text, empty states, loading states, and variable content gracefully.
- Do not introduce horizontal scrolling unless it is intentional and usable.

### 2.5 Interaction and State

- Implement the behavior implied by the component's purpose and user requirements.
- Provide appropriate hover, focus, active, disabled, loading, success, and error states where applicable.
- Do not create decorative controls that appear functional but have no behavior.
- Preserve existing event handlers, form submissions, navigation, and data flows.
- Use the project's existing form handling and validation conventions.
- Prevent duplicate submissions where relevant.
- Use existing skeleton, empty-state, and error-state patterns when available.
- Do not invent API endpoints, backend behavior, or data contracts.

### 2.6 Code Quality and Scope Control

- Follow the repository's existing TypeScript, React, and linting conventions.
- Avoid `any`, unsafe type assertions, and ignored type errors when a safer alternative is practical.
- Use stable keys for rendered collections.
- Avoid unnecessary effects, duplicated state, and avoidable re-renders.
- Do not suppress lint, type, or build errors merely to complete the task.
- Do not rewrite unrelated files or refactor unrelated functionality.
- Never overwrite user changes or discard existing work.
- Avoid adding comments that merely repeat what the code already expresses.
- Keep the implementation straightforward and maintainable.

## 3. Conflict Resolution

When requirements conflict, apply this priority order:

1. Explicit user requirements and approvals.
2. Existing project architecture and protected-file boundaries.
3. Existing theme tokens and design-system conventions.
4. Accessibility, semantic HTML, and functional correctness.
5. User-provided visual references.
6. Reusability, maintainability, and implementation simplicity.
7. Personal stylistic preferences.

The prohibition on directly modifying shadcn component source files remains in effect unless the user explicitly approves an exception. If approval is given, clarify the exact file and scope before changing protected code.

Never silently resolve a significant conflict by violating a mandatory rule.

## 4. Definition of Done

Before considering a UI task complete, verify the following:

- [ ] Existing theme colors and design tokens are used; no unjustified arbitrary colors have been introduced.
- [ ] Tailwind utilities follow the project's conventions and version.
- [ ] HTML structure is semantic and valid.
- [ ] Existing shadcn component source files remain unchanged.
- [ ] Existing shadcn components are reused wherever appropriate.
- [ ] Supplied references have been followed as closely as possible.
- [ ] Responsive layouts work across relevant screen sizes.
- [ ] Interactive states and keyboard accessibility are handled.
- [ ] Existing functionality and public interfaces are preserved.
- [ ] No unrelated files or dependencies have been changed.
- [ ] Relevant lint, type-check, build, or test commands have been run when available.
- [ ] Any unresolved ambiguity, deviation, or limitation has been communicated to the user.

## 5. Execution Protocol

For every UI task, follow this sequence:

**Inspect → Understand → Clarify if needed → Implement → Validate → Report**

1. Inspect the repository, theme, reusable components, and relevant references.
2. Determine the smallest implementation that satisfies the requirement.
3. Ask for clarification if a significant decision cannot be safely inferred.
4. Implement the component using existing conventions and protected shared infrastructure.
5. Validate styling, semantics, responsiveness, accessibility, and functionality.
6. Run relevant project checks where practical.
7. Summarize what was changed, which existing components were reused, and any checks or limitations.

Do not claim that tests, builds, or visual verification succeeded unless they were actually performed.

**Final principle:** Build UI that feels native to the existing project, respects the user's reference, reuses the design system, and never introduces unnecessary inconsistency or risk.
