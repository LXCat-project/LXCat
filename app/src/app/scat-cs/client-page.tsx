// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { CrossSectionHeading } from "@lxcat/database/item";
import { ReactionTemplate, SearchOptions } from "@lxcat/database/item/picker";
import { PagingOptions } from "@lxcat/database/shared";
import { Button, Container, Fieldset, Group, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAdjustmentsPlus, IconGraph, IconTrash } from "@tabler/icons-react";
import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRef, useState } from "react";
import { BAG_SIZE } from "../../cs/constants";
import { CSTable } from "../../cs/cs-table";
import { Filter } from "../../cs/filter";
import {
  emptyFilter,
  informationFromTemplates,
  ReactionInformation,
} from "../../cs/filter-component";
import { searchAction } from "./actions";

interface Props {
  items: CrossSectionHeading[];
  options: SearchOptions;
  selection: Array<ReactionTemplate>;
  paging: PagingOptions;
}

export const CSClient: NextPage<Props> = ({
  items: initialItems,
  options: initialOptions,
  selection: initialSelection,
}) => {
  const [items, setItems] = useState(initialItems);
  const [options, setOptions] = useState(initialOptions);
  const [selection, setSelection] = useState(
    informationFromTemplates(initialSelection),
  );
  const [editableReaction, setEditableReaction] = useState(
    initialSelection.length - 1,
  );
  const [loading, setLoading] = useState(false);

  const nrItems = items.length;

  const canonicalUrl = "/scat-cs";

  // Only the response to the latest change is applied, so a slow response to
  // an earlier change cannot overwrite a newer selection.
  const latestRequest = useRef(0);

  const onChange = async (newSelection: Array<ReactionInformation>) => {
    const request = ++latestRequest.current;
    setLoading(true);
    try {
      const result = await searchAction(
        newSelection.map(({ options }) => options),
      );
      if (request === latestRequest.current) {
        // The selection is applied together with its options, so the picker
        // never offers choices that belong to another selection.
        setSelection(newSelection);
        setOptions(result.options);
        setItems(result.items);
      }
    } catch {
      if (request === latestRequest.current) {
        notifications.show({
          color: "red",
          title: "Could not search for cross sections",
          message: "Your selection was not applied. Try again.",
        });
      }
    } finally {
      if (request === latestRequest.current) {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <Container size="xl" py="md">
        <Stack>
          <Fieldset legend="Build your reaction template to search for cross sections">
            <Filter
              selection={selection}
              options={options}
              onChange={onChange}
              editableReaction={editableReaction}
              onEditableReactionChange={setEditableReaction}
            />
          </Fieldset>
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
                  href={`/scat-cs/inspect?ids=${
                    items.map((d) => d.id).join(",")
                  }`}
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
          <Fieldset legend="Search results" style={{ maxHeight: 600 }}>
            <CSTable items={items} loading={loading} />
          </Fieldset>
        </Stack>
      </Container>
    </>
  );
};
