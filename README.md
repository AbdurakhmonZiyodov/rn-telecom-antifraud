# rn-telecom-antifraud

React Native wrapper for the **Telecom AntiFraud** (TBM / RTMC `uz.tbm.antifraud`) SDK.
Promise-based API, single `configure` step, with the spec's init-guard, account recovery,
and SSL-pinning wiring built in — so consumer apps don't re-implement the native module.

- iOS: `AntiFraudMobile ~> 1.1.4`
- Android: `uz.tbm.antifraud:sdk:1.1.6`
- React Native: ≥ 0.76 (new architecture supported)

> Maintainer guides live in `docs/`: [releasing](./docs/RELEASING.md) · [consumer migration](./docs/MIGRATING-CONSUMER.md) · [developing](./docs/DEVELOPING.md)

---

## Install

```bash
yarn add rn-telecom-antifraud@github:AbdurakhmonZiyodov/rn-telecom-antifraud#v1.0.1
cd ios && pod install
```

> This is a **native** package. After installing you must **rebuild** the app
> (`pod install` + Xcode build / `gradlew`) — a Metro/JS reload is not enough.

## Android setup (authenticated SDK registry)

The Telecom AF SDK (`uz.tbm.antifraud`) is **not on Maven Central** — it lives on the
operator's private GitLab package registry (`git.rtmc.uz`, project id `3`). Gradle needs a
**Private-Token** to download it. The package injects the repository for you and reads the
token from the **`gpr.key`** entry in `android/local.properties` — the same key existing BRB
projects already use, so you usually add **nothing new**:

```properties
# android/local.properties
gpr.key=<GitLab Private-Token with read_package_registry scope>
```

- The GitLab project id defaults to `3`. Override only if it changes: `-PTelecomAfProjectId=<id>`
  or `TelecomAfProjectId=<id>` in `gradle.properties`.
- Get the token from the operator (RTMC / antifrod@rtmc.uz). Without it the Android build
  fails to resolve `uz.tbm.antifraud:sdk`.

> If your project already builds the inline Telecom AF module today, you already have
> `gpr.key` in `local.properties` — nothing to do.

## iOS permissions

The SDK reads device/SIM/network signals. No camera/mic is required by this package, but if
your app store listing needs it, document the anti-fraud purpose. Add to `ios/<App>/Info.plist`
only what your app actually uses.

---

## Usage

### 1. Configure once at startup

```ts
import {TelecomAF} from 'rn-telecom-antifraud';

TelecomAF.configure({
  host: 'https://my-biznes.uz', // participant host — ask your backend
  sslPins: [], // see "SSL pinning" below — leave empty until you have the pins
});
```

### 2. Initialize (app launch + before the OTP verify)

```ts
// At app launch and right before the registration/login OTP screen:
await TelecomAF.ensureInitialized(); // guards via isInitialized, retries, applies SSL pins
```

### 3. Registration / login

```ts
// After the user enters the SMS code (phone is normalized to 998XXXXXXXXX automatically):
await TelecomAF.verifySmsCode(phone, code);
```

### 4. P2P / financial operation

```ts
// Before sending the OTP (refreshes the AF session; recovers an inactive account once):
await TelecomAF.makeOperationWithRecovery();

// After the user enters the OTP (fire-and-report — the backend's check-fraud is the gate):
try {
  await TelecomAF.detectFraud(code);
} catch (e) {
  /* don't block the legitimate transfer */
}
```

### 5. Device-binding header

```ts
// In your axios/fetch interceptor:
const appId = await TelecomAF.getApplicationId(); // cached + auto-recovery; null if not ready
if (appId) config.headers['application-id'] = appId;
```

### 6. Logout

```ts
await TelecomAF.logout(); // best-effort; also clears the cached applicationId
```

---

## SSL pinning — what it is and what YOU need to do

**What it is.** Normally HTTPS trusts any certificate signed by a CA in the device's trust
store. An attacker with a rogue/proxy/MITM certificate can therefore intercept and tamper
with traffic. **Certificate pinning** makes the app trust only a specific server key: on every
HTTPS request the SDK compares the server's public-key hash against a list you provide; if it
doesn't match, the request is refused. For an anti-fraud system this is important — without it
a man-in-the-middle could read OTPs/device data or forge the fraud verdict.

**What you need to do (3 steps):**

1. **Get the pins.** Two options:
   - Ask the operator (RTMC) for the SHA-256 public-key pins of the AF host, **or**
   - Compute them yourself from the host certificate:
     ```bash
     openssl s_client -connect my-biznes.uz:443 -servername my-biznes.uz </dev/null 2>/dev/null \
       | openssl x509 -pubkey -noout \
       | openssl pkey -pubin -outform der \
       | openssl dgst -sha256 -binary | openssl enc -base64
     ```
     Prefix the result with `sha256/`. Example: `sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`

2. **Provide two pins** — the current certificate **and** a backup (the next certificate),
   so a certificate rotation on the server doesn't lock users out:
   ```ts
   TelecomAF.configure({
     host: 'https://my-biznes.uz',
     sslPins: [
       'sha256/<current-cert-key-hash>',
       'sha256/<backup-cert-key-hash>',
     ],
   });
   ```

3. **Rebuild the app.** Pinning is applied inside `ensureInitialized()` after `initialize()`.

> Until you provide `sslPins`, pinning is **NOT enforced** — everything still works, there is
> just no MITM protection yet. When the operator gives you the hashes, add them and rebuild.

You can also rotate pins at runtime: `TelecomAF.setSslPinning([...])` / `TelecomAF.clearSslPinning()`.

---

## API

| Method | Purpose |
| --- | --- |
| `configure(config)` | Store host + SSL pins. Call once at startup. |
| `isAvailable()` | Native module linked? |
| `isConfigured()` | `configure()` called? |
| `ensureInitialized()` | Init only if not already (spec) + retry + apply pins. Returns `boolean`. |
| `isInitialized()` | Raw SDK init flag. |
| `verifySmsCode(phone, code)` | Registration/login verify (phone auto-normalized). |
| `confirmFace(birthDate, document)` | Registration biometric (usually done by the backend). |
| `makeOperation()` | Refresh AF session before P2P (requires ACTIVE account). |
| `makeOperationWithRecovery()` | `makeOperation` + re-init & retry once on inactive/not-found. |
| `detectFraud(code)` | Report the P2P code / trigger fraud check. |
| `logout()` | End AF session + clear cache (best-effort). |
| `getApplicationId()` | Cached client-instance id + recovery; `null` if not ready. |
| `setSslPinning(pins)` / `clearSslPinning()` | Runtime pinning control. |
| `clearCache()` | Reset cached applicationId / recovery guard. |

### Errors

All operational methods throw `TelecomAFError` with a stable `kind` and (when parseable) a numeric `code`:

```ts
import {TelecomAFError} from 'rn-telecom-antifraud';

try {
  await TelecomAF.makeOperation();
} catch (e) {
  if (e instanceof TelecomAFError && e.kind === 'ACCOUNT_INACTIVE') {
    // account needs full registration (login + verifySmsCode + backend face/confirm)
  }
}
```

Kinds: `NOT_CONFIGURED`, `UNAVAILABLE`, `NOT_INITIALIZED`, `ACCOUNT_INACTIVE` (118),
`ACCOUNT_NOT_FOUND` (119), `CODE_WRONG` (112), `BLOCKED` (25), `SDK_ERROR`.

---

## Notes

- The SDK methods only forward the device fingerprint / code to the AntiFraud system — the
  **real fraud verdict is read by your backend** (`check-fraud`). The mobile side never blocks
  on a verdict; it surfaces SDK transport errors only.
- An account becomes **ACTIVE** only after a full registration (the backend's
  `face/confirm/internal` is the final step). `makeOperation` works only for ACTIVE accounts.
- `lib/` is committed so git-URL consumers get the built output without running a build.

## Troubleshooting

- **`UNAVAILABLE` / "doesn't seem to be linked"** — rebuild natively (not just Metro reload).
- **Android: cannot resolve `uz.tbm.antifraud:sdk`** — set `TelecomAfGitlabProjectId` / `TelecomAfGitlabToken` (see Android setup).
- **`ACCOUNT_INACTIVE` (118)** — the device isn't registered/active yet; complete a login (verifySmsCode) and ensure the backend ran `face/confirm/internal`.
