// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

const { interpolateName } = require("loader-utils");

const schema = require("./options.json");

export default function loader(content) {
  const { rootContext, _compiler, getOptions, emitFile } = this;
  const options = getOptions(schema);
  const { flags, outputPath } = options;

  const name = interpolateName(this, "[contenthash].[ext]", {
    context: rootContext,
    content,
  });

  emitFile(name, content);

  console.log(_compiler.options.output.path);

  return `
try {
  process.dlopen(module, require("path").join(${
    JSON.stringify(
      outputPath || _compiler.options.output.path,
    )
  }, /*__webpack_public_path__,*/ ${JSON.stringify(name)}${
    typeof flags !== "undefined" ? `, ${JSON.stringify(options.flags)}` : ""
  }));
} catch (error) {
  throw new Error('nextjs-node-loader:\\n' + error);
}
`;
}

export const raw = true;
