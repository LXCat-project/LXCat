// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import "server-only";

// @lxcat/converter is a native napi-rs addon: a `.node` binary wrapped in a
// generated JS loader. Bundlers cannot bundle native `.node` files.
// `serverExternalPackages` is supposed to exclude this package from
// bundling, but Turbopack still traces into its internals when resolving
// it and fails when it reaches the platform-specific `.node` file. The
// `turbopackIgnore`/`webpackIgnore` comment below tells both bundlers to
// leave this import entirely alone and resolve it at runtime instead.
export const { convertDocument, convertMixture } = await import(
  /* webpackIgnore: true */
  /* turbopackIgnore: true */
  "@lxcat/converter"
);
