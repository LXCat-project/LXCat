// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { CrossSectionHeading } from "@lxcat/database/item";
import {
  CSSetTree,
  defaultReactionTemplate,
  ReactionOptions,
  ReactionTemplate,
  Reversible,
  SearchOptions,
  StateProcess,
} from "@lxcat/database/item/picker";
import {
  getStateLeafs,
  PagingOptions,
  StateTree,
} from "@lxcat/database/shared";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { Button, Fieldset, Group, Stack } from "@mantine/core";
import { IconAdjustmentsPlus, IconGraph, IconTrash } from "@tabler/icons-react";
import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { SWRConfig, unstable_serialize } from "swr";
import { BAG_SIZE } from "../../cs/constants";
import { CSTable } from "../../cs/cs-table";
import { Filter } from "../../cs/filter";
import {
  emptyFilter,
  informationFromTemplates,
  ReactionInformation,
} from "../../cs/swr-filter-component";
import { CacheMap } from "../../shared/swr-cache-map";
import { omit } from "../../shared/utils";

interface Example {
  label: string;
  selection: Array<ReactionTemplate>;
  options: SearchOptions;
}

interface Props {
  items: CrossSectionHeading[];
  options: SearchOptions;
  selection: Array<ReactionTemplate>;
  paging: PagingOptions;
  defaultReactionOptions: ReactionOptions;
  examples: Example[];
}

const generateCachePairs = (
  selection: ReactionTemplate,
  options: ReactionOptions,
) => [
  [unstable_serialize(omit(selection, "typeTags")), options.typeTags] as [
    string,
    Array<ReactionTypeTag>,
  ],
  [unstable_serialize(omit(selection, "reversible")), options.reversible] as [
    string,
    Array<Reversible>,
  ],
  [unstable_serialize(omit(selection, "set")), options.set] as [
    string,
    CSSetTree,
  ],
  ...options.consumes.map(
    (tree, index) =>
      [
        unstable_serialize({
          consumes: getStateLeafs(
            selection.consumes.filter(
              (_, selectionIndex) => selectionIndex !== index,
            ),
          ),
          produces: getStateLeafs(selection.produces),
          reversible: selection.reversible,
          typeTags: selection.typeTags,
          csSets: selection.set,
          process: StateProcess.Consumed,
        }),
        tree,
      ] as [string, StateTree],
  ),
  ...options.produces.map(
    (tree, index) =>
      [
        unstable_serialize({
          consumes: getStateLeafs(selection.consumes),
          produces: getStateLeafs(
            selection.produces.filter(
              (_, selectionIndex) => selectionIndex !== index,
            ),
          ),
          reversible: selection.reversible,
          typeTags: selection.typeTags,
          csSets: selection.set,
          process: StateProcess.Produced,
        }),
        tree,
      ] as [string, StateTree],
  ),
];

export const CSClient: NextPage<Props> = ({
  items: initialItems,
  options,
  selection: initialSelection,
  defaultReactionOptions,
}) => {
  const [items, setItems] = useState(initialItems);
  const [selection, setSelection] = useState(
    informationFromTemplates(initialSelection),
  );
  const [editableReaction, setEditableReaction] = useState(
    initialSelection.length - 1,
  );
  const [loading, setLoading] = useState(false);

  const nrItems = items.length;

  const canonicalUrl = "/data";

  const onChange = async (newSelection: Array<ReactionInformation>) => {
    setLoading(true);
    const res = await fetch(
      `/api/data?${new URLSearchParams({
        reactions: JSON.stringify(newSelection.map(({ options }) => options)),
        offset: "0",
      })}`,
    );
    setItems(await res.json());
    setSelection(newSelection);
    setLoading(false);
  };

  return (
    <>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <Stack align="center">
        <SWRConfig
          value={{
            provider: () =>
              new CacheMap([
                ...generateCachePairs(
                  defaultReactionTemplate(),
                  defaultReactionOptions,
                ),
                ...selection.flatMap((selected, index) =>
                  generateCachePairs(selected.options, options[index])
                ),
              ]),
          }}
        >
          <Fieldset
            legend="Build your reaction template to search for cross sections"
            style={{ marginTop: 10, width: "90%" }}
          >
            <Filter
              selection={selection}
              onChange={onChange}
              editableReaction={editableReaction}
              onEditableReactionChange={setEditableReaction}
            />
          </Fieldset>
        </SWRConfig>
        <Group justify="center">
          <Button
            color="red"
            disabled={items.length == 0 && selection.length < 2}
            onClick={() => {
              onChange([emptyFilter()]);
              setEditableReaction(0);
            }}
            leftSection=<IconTrash />
          >
            Clear selection
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onChange([...selection, emptyFilter()]);
              setEditableReaction(selection.length);
            }}
            leftSection=<IconAdjustmentsPlus />
          >
            Add Filter
          </Button>
          {nrItems > 0 && nrItems <= BAG_SIZE
            ? (
              <Link
                href={`/data/inspect?ids=${items.map((d) => d.id).join(",")}`}
                passHref
                legacyBehavior
              >
                <Button
                  leftSection={<IconGraph />}
                  component="a"
                  style={{ textDecorationLine: "none" }}
                  variant="light"
                >
                  Plot selection
                </Button>
              </Link>
            )
            : <></>}
        </Group>
        <Fieldset legend="Search results" w="90%" style={{ maxHeight: 600 }}>
          <CSTable items={items} loading={loading} />
        </Fieldset>
      </Stack>
    </>
  );
};
