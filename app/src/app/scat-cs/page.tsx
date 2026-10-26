// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PAGE_SIZE } from "@/cs/constants";
import { getTemplateFromQuery } from "../../cs/template-from-query";
import { CSClient } from "./client-page";
import { search } from "./search-items";

export default async function CSPage(
  { searchParams }: {
    searchParams: Promise<Record<string, string | Array<string> | undefined>>;
  },
) {
  const query = await searchParams;

  const template = getTemplateFromQuery(query);
  const paging = {
    offset: query.offset && !Array.isArray(query.offset)
      ? parseInt(query.offset)
      : 0,
    count: PAGE_SIZE,
  };

  const { options, items } = await search(template, paging);

  return (
    <CSClient
      items={items}
      options={options}
      selection={template}
      paging={paging}
    />
  );
}
