# Releasing

Consumers install via git tag (`#v1.0.0`), so a release = a built `lib/` + a tag.

1. Make your change in `src/` / `ios/` / `android/`.
2. `yarn typecheck && yarn lint`.
3. Bump `version` in `package.json`.
4. Build the output (committed for git-URL consumers):
   ```bash
   yarn build   # runs react-native-builder-bob → lib/
   ```
5. Commit everything **including `lib/`**:
   ```bash
   git add -A && git commit -m "chore: release v1.0.0"
   git tag v1.0.0
   git push && git push --tags
   ```
6. In each consumer app, bump the dependency tag:
   ```json
   "rn-telecom-antifraud": "github:AbdurakhmonZiyodov/rn-telecom-antifraud#v1.0.0"
   ```
   then `yarn install && cd ios && pod install` and rebuild.

> npm publishing is intentionally disabled — distribution is GitHub-only.
