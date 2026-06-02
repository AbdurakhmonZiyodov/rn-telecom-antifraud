# Developing

## Layout

```
src/
  index.ts                    # public exports
  TelecomAntiFraud.ts         # configure + wrapper + helpers (ensureInitialized, recovery, cache)
  NativeTelecomAntiFraud.ts   # TurboModule spec (typed surface; runtime falls back to NativeModules)
  types.ts                    # TelecomAFConfig, ...
  errors.ts                   # TelecomAFError + code→kind mapping
ios/      RNTelecomAntiFraud.swift + .mm   # RCT_EXTERN_MODULE bridge
android/  src/main/java/com/rntelecomantifraud/*.kt + build.gradle (authed SDK repo)
```

## Local loop

```bash
yarn install
yarn typecheck
yarn build        # bob → lib/
```

To test against an app, install it by path and rebuild natively:
```json
"rn-telecom-antifraud": "file:../react-native-telecom-antifraud"
```

## Bumping the native SDK

- iOS: change the version in `rn-telecom-antifraud.podspec` (`s.dependency "AntiFraudMobile", "~> x.y.z"`).
- Android: change `uz.tbm.antifraud:sdk:x.y.z` in `android/build.gradle`.
- Re-test on a real device + SIM (SIM/device signals can't be validated on a simulator).

## Adding a method

1. Add it to the native modules (`.swift`/`.mm` + `.kt`).
2. Add it to the `Spec` in `NativeTelecomAntiFraud.ts`.
3. Add the wrapper in `TelecomAntiFraud.ts` (wrap errors with `toTelecomAFError`).
4. Export / document. Bump version, build, tag (see RELEASING).

## Error kinds

`errors.ts` maps AntiFraud numeric codes to a stable `kind`. When the SDK adds codes, extend
`TelecomAFErrorKind` + `toTelecomAFError` rather than leaking raw strings to consumers.
