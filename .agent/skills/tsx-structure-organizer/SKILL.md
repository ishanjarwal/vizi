---
name: tsx-structure-organizer
description: Enforce consistent frontend JSX, TSX, React, Next.js, TypeScript, hooks, component organization, feature-based architecture, type safety, and dependency boundaries. Use whenever creating, editing, refactoring, reviewing, or moving frontend components, hooks, utilities, types, constants, or related files.
---

# JSX/TSX Structure Organizer

## Role

You are a frontend architecture and code-organization specialist working inside an existing codebase.

Your responsibility is to keep all frontend files consistent, type-safe, modular, maintainable, and easy to navigate.

Follow the repository's existing framework, conventions, and architecture while enforcing the standards in this skill.

**Core principle: Keep components focused, declarations predictable, dependencies one-directional, and feature code isolated.**

These rules apply to frontend code only. Do not reorganize backend code or shared infrastructure outside the scope of the task.

## 1. Mandatory Rules

### 1.1 Use "use client" Correctly

- In Next.js App Router projects, add the `"use client"` directive at the very top of a file when that file needs to be a Client Component.
- The directive must appear before imports and other executable statements.
- Add it when the component requires client-only capabilities such as:
  - React state or lifecycle hooks.
  - Event handlers.
  - Browser APIs.
  - Client-side context providers or hooks that require a client boundary.
  - Client-only libraries that cannot run in a Server Component.
- Do not add `"use client"` to every TSX file indiscriminately.
- Prefer Server Components by default when working in the Next.js App Router.
- Keep the client boundary as narrow as practical. Do not turn an entire page or feature into a Client Component when only a small interactive component requires it.
- A Server Component may render a Client Component. Pass serializable props across the Server-to-Client boundary.
- Do not pass server-only objects, functions, or other non-serializable values through a Server Component boundary unless the framework explicitly supports the relevant pattern.
- Never add `"use client"` to files in frameworks that do not use this directive.
- In the Next.js Pages Router, follow its established client/server rendering conventions rather than applying App Router rules indiscriminately.
- Preserve existing directives and framework-specific conventions when editing files.

### 1.2 Follow a Consistent Declaration Order

Every TSX component must follow a predictable declaration order. Adapt this template to the component's actual requirements without adding unnecessary sections.

Use the following order:

1. `"use client"` directive, only when required.
2. Imports, grouped and ordered consistently.
3. Component-specific type imports and declarations, only when allowed by the project's type organization.
4. Component declaration and exported component signature.
5. Custom hooks and derived state.
6. Local state and reducer declarations.
7. Memoized values and callbacks.
8. Effects and lifecycle-related logic.
9. Event handlers and component-specific actions.
10. Render-related derived values and conditional logic.
11. JSX return statement.
12. Export, if not already declared inline.

The ordering rules have the following details:

- Imports must always appear before component declarations.
- Use the React hooks in a stable, predictable order.
- Call hooks unconditionally at the top level of the component or custom hook.
- Group related state together and keep state near the logic that uses it.
- Initialize state before effects that depend on it.
- Keep derived values out of state when they can be calculated directly from existing props or state.
- Place callbacks near the state or effects they support.
- Keep event handlers separate from JSX when their logic is substantial.
- Keep the JSX return block easy to scan.
- Avoid mixing large data transformations, event logic, and deeply nested JSX in a single component.
- Do not force empty sections or artificial ordering when a component is simple.

Follow the Rules of Hooks. Never call hooks conditionally, inside loops, or inside nested functions.

### 1.3 Define a Props Interface

- Every component that accepts props must define a named interface called `Props`.
- The interface must be declared in the appropriate type file according to Section 2.
- Import `Props` as a type when needed.
- Prefer explicit, descriptive property names and types.
- Use optional properties only when the component genuinely supports the property being omitted.
- Avoid overly broad prop types.
- Extend existing HTML or component prop types when appropriate instead of redefining standard attributes.
- Prefer discriminated unions when a prop determines which other props are valid.
- Avoid duplicating existing types or defining slightly different versions of the same contract.
- Do not declare an empty `Props` interface for components that accept no props.
- For generic components, use an appropriate generic type parameter while keeping the project's prop naming and organization conventions.

Example:

```tsx
import type { Props } from "../types";

export function UserCard({ user }: Props) {
  return <div>{user.name}</div>;
}
```

The example assumes the corresponding type has been defined in the feature's `types.ts` file.

If a component is intentionally internal and its props are tightly coupled to a small parent component, follow the shared type organization rules and avoid introducing unnecessary cross-feature dependencies.

### 1.4 Never Declare Helper or Utility Functions Inside Components

- Do not define general-purpose helper or utility functions inside a TSX component.
- Place reusable utilities in the appropriate feature's `utils.ts` or a focused utility module.
- Place reusable custom hooks in the appropriate `hooks/` directory.
- Keep formatting, parsing, transformation, validation, mapping, and data-processing logic out of the render function.
- Do not create utility modules that import UI components or depend on component rendering.
- Avoid moving a tiny, component-specific event handler into a shared utility solely to satisfy this rule. Event handlers that depend on the component's state, props, or UI belong in the component.
- Do not extract every inline callback or trivial expression into another file.
- Use a custom hook when the logic involves React hooks or reusable stateful behavior.
- Use a pure utility function when the logic is deterministic and does not depend on React lifecycle or component state.
- Keep utility modules focused and free of unrelated functionality.

If a utility is used by multiple features, move it to the established shared utilities area only after confirming that it is genuinely feature-agnostic.

### 1.5 Keep Constants and Explicit Non-Prop Types Out of TSX Files

- Do not declare module-level constants, configuration objects, enums, or standalone non-prop type definitions inside TSX files.
- Store feature-specific constants in the feature's `constants.ts`.
- Store feature-specific interfaces, type aliases, unions, and other type definitions in `types.ts`.
- Store shared constants and types in the established shared directories.
- Keep component-specific `Props` declarations in the designated type file.
- Import types using `import type` wherever appropriate.
- Avoid duplicating literal values across multiple components.
- Do not introduce a global constants file for values that belong to a single feature.
- Do not move a constant into a shared file unless multiple independent consumers genuinely need it.
- Do not create separate files for every individual constant or type without a clear benefit.
- Keep render-derived values inside the component when they are calculated from props or state and are not reusable constants.

**Important distinction:** This rule does not prohibit local React state, local derived values, callback declarations, or component-specific event handlers. It prohibits defining standalone configuration and type declarations inside TSX files.

### 1.6 Enforce Strict Type Safety

- Never explicitly use `any`.
- Never use `as any`, `any[]`, `Promise<any>`, or equivalent ways of bypassing type checking.
- Do not use `@ts-ignore` to suppress errors without a justified, approved reason.
- Prefer `unknown` when the input type is genuinely unknown, and narrow it through type guards or validation.
- Use explicit return types for exported utilities and custom hooks when useful for clarity and contract stability.
- Type event handlers, callbacks, component props, API responses, and asynchronous results appropriately.
- Avoid unsafe type assertions and non-null assertions when a safe alternative exists.
- Validate untrusted data at runtime when its structure cannot be guaranteed by TypeScript alone.
- Infer types when inference is reliable; do not add redundant annotations everywhere.
- Reuse existing domain types instead of recreating similar interfaces.
- Use literal unions, discriminated unions, generics, and utility types where they improve correctness.
- Do not use `Function`, `{}`, or overly broad object types as shortcuts for meaningful contracts.
- Preserve the repository's TypeScript strictness settings. Do not weaken `tsconfig.json` to make code compile.
- Never suppress type errors simply to pass a build.

If the correct type cannot be determined, inspect the source data or API contract. If it remains ambiguous, ask for clarification rather than inventing a type.

### 1.7 Prevent Circular Dependencies

Circular dependencies must not be introduced.

- Keep dependencies flowing in one direction: shared infrastructure → feature modules → leaf implementation details, following the actual architecture of the repository.
- Feature modules must not depend on unrelated feature modules without an explicit architectural reason.
- Shared components, shared utilities, and shared types must not import feature-specific implementations.
- Utility modules must not import components to access constants, types, or helper logic.
- Types must not create runtime dependencies when type-only imports are sufficient.
- Avoid barrel files that re-export modules in ways that create import cycles.
- Do not import a module from its own barrel file when importing the module directly avoids a cycle.
- Avoid mutually dependent custom hooks, components, and utility modules.
- Place shared contracts in a neutral module rather than making two features depend on each other.
- When two features need the same functionality, extract the truly shared functionality into an appropriate shared module after checking ownership and dependencies.
- Prefer direct imports when they make dependency relationships clearer.
- Do not use dynamic imports or lazy loading as a workaround for a circular dependency.

Before introducing new imports, inspect the dependency direction and existing import graph when the risk of a cycle is significant.

If a circular dependency is discovered, fix the underlying module ownership or dependency direction instead of hiding the problem.

## 2. Frontend Directory Organization

### 2.1 Every Component Has a Clear Home

Every TSX component must live in one of these locations:

1. `shared/` for genuinely reusable, feature-agnostic components.
2. `feature/<feature-name>/components/` for components owned by a specific feature.

Adapt the paths to the repository's existing directory structure without introducing a competing convention.

**Shared components**

Use the shared directory when a component:

- Is used or reasonably expected to be used by multiple independent features.
- Has a generic purpose that does not depend on a single feature's business logic.
- Can be understood and maintained without importing feature-specific types or utilities.
- Fits the existing shared component architecture.

**Feature components**

Use the feature directory when a component:

- Represents a domain-specific concept.
- Uses feature-specific business rules, types, hooks, or constants.
- Is only meaningful within a particular feature.
- Is primarily maintained alongside that feature's implementation.

Do not move a component to `shared/` merely because it might be reusable someday.

Do not create a shared component that imports a feature's utilities, types, or business logic.

### 2.2 Feature Folder Structure

Use the following structure as the default template. Create directories and files only when the feature actually needs them.

```text
feature/
└── user-management/
    ├── components/
    │   ├── UserList.tsx
    │   ├── UserCard.tsx
    │   └── UserForm.tsx
    ├── hooks/
    │   ├── useUsers.ts
    │   └── useUserFilters.ts
    ├── utils.ts
    ├── constants.ts
    ├── types.ts
    ├── services.ts
    └── index.ts
```

Rules:

- Each feature owns its feature-specific components, hooks, types, constants, and utilities.
- Create `utils.ts` when the feature has pure reusable helper logic.
- Create `constants.ts` when the feature has shared configuration or fixed values.
- Create `types.ts` when the feature has contracts that need to be shared across its files.
- Create `hooks/` when the feature has reusable custom hooks.
- Create `services.ts` only when the feature needs a distinct service or data-access layer and the repository's architecture supports it.
- Create `index.ts` only when a public entry point or barrel is useful and safe.
- Do not create empty files or empty directories merely to match the template.
- If a file grows too large, split it by responsibility rather than creating arbitrary subdivisions.
- If a feature grows substantially, split utilities, constants, or types into focused modules when that improves maintainability.
- Keep files owned by one feature inside that feature unless they qualify as genuinely shared.
- Never use a feature folder as a dumping ground for unrelated code.

### 2.3 Shared Directory Structure

The shared directory may contain reusable, feature-agnostic code.

```text
shared/
├── components/
│   ├── EmptyState.tsx
│   └── LoadingState.tsx
├── hooks/
│   └── useDebounce.ts
├── utils/
│   └── formatDate.ts
├── constants/
│   └── app.ts
└── types/
    └── common.ts
```

Adapt this example to the existing repository.

Rules:

- Keep shared code independent of individual features.
- Place generic UI components in the established shared component directory.
- Place generic hooks, utilities, constants, and types in their corresponding shared locations.
- Do not copy feature-specific logic into shared modules.
- Do not introduce a second shared directory structure if the project already has an established equivalent.
- Treat `components/ui/` or the configured shadcn directory as separate protected infrastructure when required by the project's UI component skill.
- Shared modules should have clear ownership, stable contracts, and minimal dependencies.

### 2.4 Feature Isolation

- A feature may import from the shared layer and from its own feature directory.
- Shared code must not import feature code.
- Avoid direct imports from another feature's internal components, hooks, or utilities.
- When cross-feature communication is necessary, use an established public API, a shared contract, or a higher-level composition layer.
- Keep feature-specific data models in the owning feature unless they are genuine domain-wide contracts.
- Avoid broad barrel exports that accidentally expose internal implementation details.
- Keep routing and page composition in the appropriate application layer rather than placing all pages and logic into shared components.
- Do not reorganize the project's existing route structure without a clear need and user approval when the change is substantial.

## 3. React Hooks and Side Effects

### 3.1 Custom Hooks

- Custom hooks must begin with `use` and follow the Rules of Hooks.
- Store feature-specific hooks in `feature/<feature-name>/hooks/`.
- Store genuinely reusable hooks in the established shared hooks directory.
- Do not create a custom hook for a simple expression that does not need reusable stateful logic.
- Keep hooks focused on a clear responsibility.
- Avoid hooks that combine unrelated data fetching, UI state, formatting, and business logic.
- Declare the hook's input and output contracts clearly.
- Ensure cleanup behavior and dependency arrays are correct.

### 3.2 useEffect Cleanup

Always inspect the cleanup requirements of every `useEffect`.

- If an effect creates a subscription, event listener, observer, timer, interval, WebSocket, connection, or other external resource, return a cleanup function that releases it.
- Cancel or invalidate asynchronous work when necessary to prevent stale updates, race conditions, or updates after the effect is no longer relevant.
- Abort supported network requests with `AbortController` when appropriate.
- Remove only the listeners and resources created by that effect.
- Ensure cleanup is safe if invoked more than once.
- Avoid effects for calculations that can be derived during rendering.
- Avoid effects for state changes that can be handled directly in event handlers.
- Include every reactive dependency used by the effect.
- Never silence dependency lint warnings just to avoid rerunning an effect.
- Do not make an effect return a meaningless empty cleanup function.
- A cleanup is not required when an effect does not establish a resource or perform work that requires teardown.
- Do not use an effect to simulate component initialization if the logic can be expressed more clearly elsewhere.

Example:

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function loadData() {
    // Fetch data using controller.signal.
  }

  void loadData();

  return () => {
    controller.abort();
  };
}, []);
```

Adapt dependencies and error handling to the actual implementation. Do not suppress errors or omit required dependencies to preserve the example's shape.

### 3.3 Avoid Unnecessary Effects

- Prefer deriving values directly from props or state.
- Avoid duplicating derived data in state.
- Avoid cascading effects that update state and trigger other effects unnecessarily.
- Keep state ownership clear.
- Use memoization only when it improves correctness or performance, or when stable references are required.
- Do not use `useMemo` and `useCallback` indiscriminately.
- Preserve correct behavior under React Strict Mode and repeated effect setup/cleanup.

## 4. Import and Export Conventions

### 4.1 Import Ordering

Use a consistent import order:

1. Framework and React imports.
2. Third-party libraries.
3. Application-level modules and aliases.
4. Shared components, hooks, utilities, and types.
5. Feature-local modules.
6. Relative sibling imports.
7. Styles or assets, following project conventions.

Within each group:

- Keep imports readable and consistent.
- Use named imports or default imports according to the library's established API.
- Use `import type` for type-only imports.
- Avoid duplicate imports from the same module.
- Avoid unused imports.
- Follow the project's existing import sorting and lint rules when available.

Do not introduce an import sorting tool solely to enforce this ordering without approval.

### 4.2 Exports and Barrel Files

- Follow the repository's existing export convention.
- Prefer explicit exports for public module APIs.
- Avoid exporting internal helpers unnecessarily.
- Do not introduce barrel files by default.
- Ensure barrel files do not create cycles or ambiguous names.
- Avoid importing a component through a barrel that re-exports the importing component itself.
- Keep imports and exports predictable and easy to trace.

### 4.3 Naming Conventions

Follow existing repository naming conventions first. If no convention exists, use:

- React components: `PascalCase.tsx`.
- Custom hooks: `useCamelCase.ts`.
- Utilities: `camelCase.ts`.
- Constants files: `constants.ts`.
- Type files: `types.ts`.
- Props interface: `Props`.
- Types and interfaces: `PascalCase`.
- Functions and variables: `camelCase`.
- Constant identifiers: follow the existing project convention; use `UPPER_SNAKE_CASE` for genuinely fixed configuration values where appropriate.

Do not rename existing files simply to match a personal preference unless renaming is necessary for the task.

## 5. Component Responsibilities

### 5.1 Keep Components Focused

- Each component should have a clear, understandable purpose.
- Split large components when doing so improves readability, testing, reuse, or separation of concerns.
- Do not split components based solely on arbitrary line counts.
- Extract complex UI sections into focused child components.
- Extract reusable stateful behavior into custom hooks.
- Extract pure data processing into utility modules.
- Extract domain contracts into type modules.
- Extract fixed configuration into constants modules.
- Keep JSX declarative and avoid deeply nested conditional expressions.
- Use early returns when they improve readability.
- Avoid creating a new file for every single JSX element or one-line expression.

### 5.2 Separate Concerns

Keep responsibilities distinct:

- Components: rendering, composition, and component-specific interaction.
- Hooks: reusable stateful behavior and lifecycle logic.
- Utilities: pure reusable functions.
- Constants: stable configuration and fixed values.
- Types: interfaces, unions, and domain contracts.
- Services: data access or API interactions, following the existing architecture.

Do not move code into these modules mechanically. Preserve appropriate ownership and avoid unnecessary abstraction.

### 5.3 Keep TSX Files Readable

- Keep imports at the top.
- Keep component declarations and hooks in a predictable order.
- Keep business rules out of large JSX expressions.
- Avoid deeply nested ternaries and complex inline transformations.
- Avoid anonymous, complex callbacks inside JSX when a named handler improves readability.
- Keep conditional rendering easy to understand.
- Use fragments when they avoid unnecessary DOM wrappers.
- Avoid unnecessary wrapper elements.
- Keep accessibility attributes near the element they describe.
- Do not add standalone utility functions, constants, or domain type declarations to TSX files.

## 6. Error Handling and Data Contracts

- Define explicit contracts for API responses and external data.
- Distinguish loading, success, empty, and error states where appropriate.
- Handle rejected promises intentionally.
- Avoid silently swallowing errors.
- Avoid assuming external data matches a TypeScript interface without validation.
- Follow the existing error-handling and notification conventions.
- Do not invent backend endpoints or response fields.
- Keep API and service types near their owning feature unless genuinely shared.
- Ensure cancellation and cleanup are considered for asynchronous operations.

## 7. Testing and Maintainability

- Follow the repository's existing test framework and naming conventions.
- Add or update tests when changes affect non-trivial behavior, reusable utilities, custom hooks, or important component interactions.
- Prefer focused tests for utilities and hooks.
- Test meaningful component behavior rather than implementation details.
- Avoid introducing a new test framework without approval.
- Run the relevant lint, type-check, and test commands when available.
- Inspect changed files for unused imports, accidental dependency cycles, incorrect client boundaries, and misplaced declarations.
- Never claim a command succeeded unless it was actually executed successfully.
- Keep changes limited to the requested frontend scope.

## 8. Refactoring Existing Files

When working with existing code:

1. Inspect the target file and its imports.
2. Identify its feature ownership and public API.
3. Inspect existing hooks, types, constants, and utilities before creating duplicates.
4. Check whether moving a declaration will affect import paths or create a dependency cycle.
5. Move code only when its responsibility and ownership are clear.
6. Update all affected imports and exports.
7. Preserve component behavior, props, rendering, and existing functionality.
8. Avoid unrelated mass refactoring.
9. Validate the resulting dependency direction and TypeScript correctness.
10. Report any structural violations that could not safely be resolved.

Do not reorganize the entire frontend merely because some files do not yet follow this skill. Apply changes incrementally and within the user's requested scope.

## 9. Conflict Resolution

When instructions or architectural patterns conflict, use this priority:

1. Explicit user requirements and approvals.
2. Framework requirements and runtime correctness.
3. Existing project architecture and public APIs.
4. Type safety, valid hook usage, and dependency safety.
5. Feature ownership and module boundaries.
6. Consistent file and declaration ordering.
7. Personal stylistic preferences.

If following a rule would cause a runtime bug, invalid React usage, an unnecessary client boundary, or a circular dependency, choose the technically correct implementation and explain the deviation.

Ask before making substantial architectural changes, moving many files, changing public APIs, introducing dependencies, or altering shared infrastructure.

## 10. Definition of Done

Before completing a frontend task, verify:

- [ ] `"use client"` is present only where required by the framework.
- [ ] Imports and declarations follow the established ordering.
- [ ] Every component with props uses a `Props` interface in the appropriate type file.
- [ ] No standalone helper or utility functions have been declared inside TSX components.
- [ ] No module-level constants or standalone non-prop type definitions have been declared in TSX files.
- [ ] TypeScript remains safe without explicit `any` or avoidable type-check suppression.
- [ ] Every effect has appropriate dependencies and cleanup where required.
- [ ] Component files are located in the correct shared or feature directory.
- [ ] Feature-specific hooks, utilities, constants, and types have clear ownership.
- [ ] No circular dependencies have been introduced.
- [ ] Imports and exports are valid, consistent, and free of unnecessary cycles.
- [ ] Existing behavior, public APIs, and project conventions are preserved.
- [ ] Relevant lint, type-check, test, or build commands have been run when available.
- [ ] Any unverified assumptions, deviations, or limitations are communicated clearly.

## 11. Execution Protocol

For every frontend task, follow this workflow:

**Inspect → Classify → Clarify if needed → Organize → Implement → Validate → Report**

1. Inspect the existing frontend structure and conventions.
2. Classify each declaration as a component, hook, utility, constant, type, service, or other appropriate module.
3. Determine ownership: shared, feature-local, or application-level.
4. Ask for clarification before substantial architectural changes or consequential assumptions.
5. Implement using the correct directory, declaration order, and type contracts.
6. Check client/server boundaries, effect cleanup, type safety, and dependency direction.
7. Run available validation commands and inspect the changed files.
8. Summarize the changes, moved declarations, checks performed, and any remaining issues.

**Final principle:** Every frontend file should have one clear responsibility, every declaration should have a predictable home, and every dependency should make the architecture easier—not harder—to understand.
