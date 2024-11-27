// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PAGE_SIZE } from "@/cs/constants";
import { db } from "@lxcat/database";
import { defaultSearchTemplate } from "@lxcat/database/item/picker";
import { getStateLeaf, StateLeaf } from "@lxcat/database/shared";
import deepEqual from "fast-deep-equal";
import { getTemplateFromQuery } from "../../cs/template-from-query";
import { CSClient } from "./client-page";

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

  const defaultTemplates = defaultSearchTemplate();
  const defaultOptions = db().getSearchOptions(defaultTemplates);

  const [options, items] = deepEqual(defaultTemplates, template)
    ? [await defaultOptions, []]
    : await Promise.all([
      db().getSearchOptions(template),
      Promise.all(
        template.map(
          async ({
            consumes: consumesPaths,
            produces: producesPaths,
            typeTags,
            reversible,
            set,
          }) => {
            const consumes = consumesPaths
              .map(getStateLeaf)
              .filter((leaf): leaf is StateLeaf => leaf !== undefined);
            const produces = producesPaths
              .map(getStateLeaf)
              .filter((leaf): leaf is StateLeaf => leaf !== undefined);

            if (
              !(
                consumes.length === 0
                && produces.length === 0
                && typeTags.length === 0
                && set.length === 0
              )
            ) {
              return db().getItemIdsByReactionTemplate(
                consumes,
                produces,
                typeTags,
                reversible,
                set,
              );
            } else {
              return [];
            }
          },
        ),
      ).then((csIdsNested) =>
        db().getItemHeadings([...new Set(csIdsNested.flat())], paging)
      ),
    ]);

  return (
    <CSClient
      items={items}
      options={options}
      selection={template}
      paging={paging}
      defaultReactionOptions={(await defaultOptions)[0]}
      examples={[]}
    />
  );
}
