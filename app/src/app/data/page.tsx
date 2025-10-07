// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { getTemplateFromQuery } from "../../cs/template-from-query";
import { CSClient } from "./client-page";
import { search } from "./search-items";

export default async function CSPage(
  { searchParams }: {
    searchParams: Promise<Record<string, string | Array<string> | undefined>>;
  },
) {
  const template = getTemplateFromQuery(await searchParams);

  const { options, matches } = await search(template);

  return <CSClient matches={matches} options={options} selection={template} />;
}
