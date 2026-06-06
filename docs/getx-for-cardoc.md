# GetX For Cardoc

Last reviewed: June 5, 2026

## Short answer

Do not add `get` / GetX to this project.

Cardoc is an Expo React Native app written in TypeScript, and GetX is a Flutter/Dart package published on `pub.dev`. As of June 5, 2026, the current `get` package version on `pub.dev` is `4.7.3`, with `5.0.0-release-candidate-9.3.2` listed as the prerelease.

Reference:

- https://pub.dev/packages/get

## What to use here instead

For this codebase, the closest equivalents are:

- State management: `zustand` stores in [`store/`](/Users/w/Projects/cardoc/store)
- Navigation: `expo-router` file routes in [`app/`](/Users/w/Projects/cardoc/app)
- Shared logic and side effects: modules in [`services/`](/Users/w/Projects/cardoc/services)
- Screen-local UI state: normal React hooks inside components and screens

## GetX-to-Cardoc mapping

If a future prompt says "use GetX", translate it like this for Cardoc:

- `GetxController` -> a Zustand store, store action, or plain service module
- `Obx` / reactive UI -> React component re-renders driven by Zustand selectors or local state
- `Bindings` / dependency injection -> direct imports plus lightweight setup in `services/*` or `useEffect`
- `Get.to()` / named routes -> `expo-router` navigation and file-based screens
- Global app utilities -> shared helpers under `services/`, `utils/`, or `hooks/`

## Project rules

- Keep app-wide state in the existing `store/*.ts` pattern.
- Keep navigation in `expo-router`; do not introduce a second routing system.
- Keep Firebase, sync, and integration logic in `services/*`.
- Prefer extending the current Zustand stores over introducing a Flutter-inspired architecture layer.

## When GetX would make sense

Only consider GetX if Cardoc is rewritten as a Flutter app. For the current repository, staying with React Native patterns is the correct path.
