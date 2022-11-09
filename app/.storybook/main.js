// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: "@storybook/react",
  core: {
    builder: {
      name: "webpack5",
      options: {
        fsCache: true,
      },
    },
  },
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};
