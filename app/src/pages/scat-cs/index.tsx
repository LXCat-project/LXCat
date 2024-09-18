// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db } from "@lxcat/database";
import { CrossSectionHeading } from "@lxcat/database/item";
import {
  CSSetTree,
  defaultReactionTemplate,
  defaultSearchTemplate,
  ReactionOptions,
  ReactionTemplate,
  Reversible,
  SearchOptions,
  StateProcess,
} from "@lxcat/database/item/picker";
import {
  getStateLeaf,
  getStateLeafs,
  PagingOptions,
  StateLeaf,
  StateTree,
} from "@lxcat/database/shared";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { Button, Fieldset, Group, Space, Text } from "@mantine/core";
import { IconAdjustmentsPlus, IconGraph, IconTrash } from "@tabler/icons-react";
import deepEqual from "deep-equal";
import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { SWRConfig, unstable_serialize } from "swr";
import { BAG_SIZE, PAGE_SIZE } from "../../cs/constants";
import { CSTable } from "../../cs/cs-table";
import { Filter } from "../../cs/filter";
import { Paging } from "../../cs/paging";
import {
  emptyFilter,
  informationFromTemplates,
  ReactionInformation,
} from "../../cs/swr-filter-component";
import { getTemplateFromQuery } from "../../cs/template-from-query";
import { Layout } from "../../shared/layout";
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

const ScatteringCrossSectionsPage: NextPage<Props> = ({
  items: initialItems,
  options,
  selection: initialSelection,
  paging: initialPaging,
  defaultReactionOptions,
}) => {
  const [items, setItems] = useState(initialItems);
  const [paging, setPaging] = useState(initialPaging);
  const [selection, setSelection] = useState(
    informationFromTemplates(initialSelection),
  );
  const [editableReaction, setEditableReaction] = useState(
    initialSelection.length - 1,
  );

  const router = useRouter();

  const nrItems = items.length;

  let canonicalUrl = "/scat-cs";
  if (paging.offset > 0) {
    canonicalUrl =
      `${process.env.NEXT_PUBLIC_URL}/scat-cs?offset=${paging.offset}`;
  }

  const onChange = async (newSelection: Array<ReactionInformation>) => {
    const res = await fetch(
      `/api/scat-cs?${new URLSearchParams({
        reactions: JSON.stringify(newSelection.map(({ options }) => options)),
        offset: "0",
      })}`,
    );
    setItems(await res.json());
    setSelection(newSelection);
    setPaging((prevPaging) => ({ ...prevPaging, offset: 0 }));
  };

  const onPageChange = async (newPaging: PagingOptions) => {
    const res = await fetch(
      `/api/scat-cs?${new URLSearchParams({
        reactions: JSON.stringify(selection),
        offset: newPaging.offset.toString(),
      })}`,
    );
    setItems(await res.json());
    setPaging(newPaging);
  };

  return (
    <Layout title="Scattering Cross Section">
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <h1>Scattering Cross Sections</h1>
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
        <Fieldset>
          <Filter
            selection={selection}
            onChange={onChange}
            editableReaction={editableReaction}
            onEditableReactionChange={setEditableReaction}
          />
        </Fieldset>
      </SWRConfig>
      <Space h="sm" />
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
              href={`/scat-cs/inspect?ids=${items.map((d) => d.id).join(",")}`}
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
      <Space h="sm" />
      {nrItems > 0 ? <CSTable items={items} /> : (
        <Text>
          The selection is empty. Use the selection tool above to start
          searching for cross sections.
        </Text>
      )}
      <Paging
        paging={paging}
        nrOnPage={nrItems}
        query={router.query}
        onChange={onPageChange}
      />
    </Layout>
  );
};

export default ScatteringCrossSectionsPage;

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  const template = getTemplateFromQuery(context.query);
  const paging = {
    offset: context.query.offset && !Array.isArray(context.query.offset)
      ? parseInt(context.query.offset)
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

  return {
    props: {
      items,
      options: options,
      selection: template,
      paging,
      defaultReactionOptions: (await defaultOptions)[0],
      examples: [],
    },
  };
};
