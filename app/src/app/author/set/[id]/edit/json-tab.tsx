// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CodeHighlight } from "@mantine/code-highlight";
import "./json-tab.css";

export const JsonTab = ({ json }: { json: string }) => (
  <CodeHighlight code={json} language="json" />
);
