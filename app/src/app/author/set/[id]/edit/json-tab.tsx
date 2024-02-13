// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CodeHighlight } from "@mantine/code-highlight";
import classes from "./json-tab.module.css";

export const JsonTab = ({ json }: { json: string }) => (
  <CodeHighlight
    classNames={classes}
    code={json}
    language="json"
  />
);
