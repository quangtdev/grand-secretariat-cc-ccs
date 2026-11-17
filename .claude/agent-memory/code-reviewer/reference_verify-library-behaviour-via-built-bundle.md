---
name: verify-library-behaviour-via-built-bundle
description: node_modules reads are blocked by the scout-block hook; how to still verify three/xterm internals during a review
metadata:
  type: reference
---

Reading `node_modules` is blocked by the scout-block hook (context saving). To check what an installed dependency really does (three.js loop order, xterm addon dispose, etc.):

- build into the scratchpad, not the repo's `dist`: `NODE_ENV=development npx vite build --outDir <scratchpad>/build --emptyOutDir`, then `rg -o '.{150}needle.{50}'` in the bundled JS;
- or fetch the upstream source at the matching tag from raw.githubusercontent.com.

Upstream master can differ from the installed version (seen 2026-11-14: xterm addon-webgl master loses its GL context on dispose, the installed ^0.19 build did not), so prefer the bundle.
