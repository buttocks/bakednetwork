# Baked Network

Two separate projects in one repository.

## 📱 Baked Live — Android application

**Created by keatingfish.** For Android phones, tablets, Android TV and Google TV.

- **[Download Baked Live v1.10 APK](https://github.com/buttocks/bakednetwork/releases/download/v1.10/baked-live-1.10.apk)**
- [Installation, remote controls, casting and chat guide](android/README.md)
- [Android release notes](https://github.com/buttocks/bakednetwork/releases/tag/v1.10)

Sign in with a [Baked.live](https://baked.live) account. New accounts must be registered in a web browser. No desktop application; browser companion features are supported. Android release publishing is separate from tube management.

---

## 📺 Baked.live tubes — channel management

**[Browse the tube project](tubes/README.md)** — channel skins, scripts, feeds, shared modules and administration bridge.

All new channel development belongs under `tubes/`. Historical version pins and required compatibility assets are retained. SlamVision remains a separate media-source dependency.

## Repository layout

- `android/` — Android application documentation and release links.
- `tubes/` — canonical channel assets and management tools.
- `.github/workflows/` — separate Android publishing and tube automation workflows.
- `modules/` and `themes/` — retained compatibility assets.
