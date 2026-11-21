# BrokenGPT release signing setup

BrokenGPT must use the same Android signing key for every release. Do not generate a new key during each GitHub Actions run, and never commit the keystore or its passwords to this repository.

A repository owner (or trusted adult helping manage the repository) should create one release keystore and add these three GitHub Actions repository secrets:

- `BROKENGPT_RELEASE_KEYSTORE_BASE64`: the keystore file encoded as one base64 line.
- `BROKENGPT_RELEASE_STORE_PASSWORD`: the keystore password.
- `BROKENGPT_RELEASE_KEY_PASSWORD`: the key password.

Create the keystore once on a trusted computer:

```sh
keytool -genkeypair -v \
  -keystore brokengpt-release.keystore \
  -storepass 'USE-A-STRONG-UNIQUE-PASSWORD' \
  -keypass 'USE-A-STRONG-UNIQUE-PASSWORD' \
  -alias brokengpt-release \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=BrokenGPT Release"
```

Encode it as a single line:

- Linux: `base64 -w 0 brokengpt-release.keystore`
- macOS: `base64 < brokengpt-release.keystore | tr -d '\\n'`

In GitHub, open the repository's **Settings → Secrets and variables → Actions → New repository secret** and add the three values above. Keep the keystore and passwords private, make a secure backup, and never paste them into chat, issues, or commits.

After the secrets exist, run the **BrokenGPT Android APK and screenshots** workflow. The workflow will stop before signing if any secret is missing, rather than silently producing an APK signed with a disposable key.

## One-time install note

Older BrokenGPT builds were signed with temporary keys that the old workflow deleted. Those signing keys cannot be recovered from the APK. The first release signed with the new persistent key therefore cannot update an installation signed by the old key: uninstall the old app once, then install the new release. Every release after that will use the same signing identity and can update normally.
