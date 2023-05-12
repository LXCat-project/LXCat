// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

const MIN_BABEL_VERSION = 7;

module.exports = (api) => {
  api.assertVersion(MIN_BABEL_VERSION);
  api.cache(true);

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: {
            node: "current",
          },
        },
      ],
    ],
  };
};
