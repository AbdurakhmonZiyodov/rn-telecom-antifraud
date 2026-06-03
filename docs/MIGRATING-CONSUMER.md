# Migrating a consumer app to `rn-telecom-antifraud`

Use this when an app currently has an **inline** native `TelecomAntiFraudModule` + JS wrapper.

## 1. Remove the inline native module

- iOS: delete `ios/TelecomAntiFraudModule.swift` + `.m` from the project (and Xcode target).
- Android: delete `android/.../TelecomAntiFraudModule.kt` + its `...Package.kt`, and unregister
  the package from `MainApplication`.
- Remove the authenticated `uz.tbm.antifraud` maven repo / dependency from `android/app/build.gradle`
  and the `pod 'AntiFraudMobile'` line from the `Podfile` — the package now provides both.

> The package's native module is named `RNTelecomAntiFraud`, so it will **not** collide with a
> leftover `TelecomAntiFraudModule`. Still, remove the inline one to avoid shipping the SDK twice.

## 2. Install the package

```bash
yarn add rn-telecom-antifraud@github:AbdurakhmonZiyodov/rn-telecom-antifraud#v1.0.1
cd ios && pod install
```
The package reuses the `gpr.key` you already keep in `android/local.properties` for the AF
SDK registry, so no new properties are needed (project id defaults to `3`).

## 3. Replace the JS usages

| Old (inline) | New |
| --- | --- |
| `TelecomAntiFraud.initialize(host)` / custom `ensureTelecomInitialized()` | `TelecomAF.configure({host, sslPins})` once + `TelecomAF.ensureInitialized()` |
| `getTelecomId()` (custom cache) | `TelecomAF.getApplicationId()` |
| `TelecomAntiFraud.verifySmsCode(phone, code)` | `TelecomAF.verifySmsCode(phone, code)` (auto-normalized) |
| `makeOperationWithRecovery()` (custom) | `TelecomAF.makeOperationWithRecovery()` |
| `TelecomAntiFraud.detectFraud(code)` | `TelecomAF.detectFraud(code)` |
| `TelecomAntiFraud.logout()` + `clearTelecomId()` | `TelecomAF.logout()` |

## 4. Keep app-specific glue

- The bypass-numbers list (App Store / Play review test phones) stays in the app.
- `host` and `sslPins` values are passed via `configure` from the app's config.
- Which screen calls which method stays in the app.

## 5. Rebuild + smoke test

`pod install`, gradle rebuild, then verify: launch init, login verify, P2P make/detect, logout.
