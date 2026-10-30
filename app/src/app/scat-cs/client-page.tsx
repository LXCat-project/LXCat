// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import {
  ReactionOptions,
  ReactionTemplate,
  SearchOptions,
} from "@lxcat/database/item/picker";
import {
  Button,
  Container,
  Fieldset,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAdjustmentsPlus, IconGraph, IconTrash } from "@tabler/icons-react";
import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRef, useState } from "react";
import { PLOT_SIZE } from "../../cs/constants";
import { CSTable } from "../../cs/cs-table";
import { Filter } from "../../cs/filter";
import {
  emptyFilter,
  informationFromTemplates,
  ReactionInformation,
} from "../../cs/filter-component";
import { searchAction, searchSetItemsAction } from "./actions";
import type { Matches } from "./search-items";

interface Props {
  matches: Matches;
  options: SearchOptions;
  selection: Array<ReactionTemplate>;
}

/** The options of a template only depend on the template itself. */
const templateKey = (
  { consumes, produces, typeTags, reversible, set }: ReactionTemplate,
) => JSON.stringify([consumes, produces, typeTags, reversible, set]);

export const CSClient: NextPage<Props> = ({
  matches: initialMatches,
  options: initialOptions,
  selection: initialSelection,
}) => {
  const [{ sets, total, plotIds }, setMatches] = useState(initialMatches);
  // Changes with every applied search, so that the table starts afresh.
  const [searchId, setSearchId] = useState(0);
  const [options, setOptions] = useState(initialOptions);
  const [selection, setSelection] = useState(
    informationFromTemplates(initialSelection),
  );
  const [editableReaction, setEditableReaction] = useState(
    initialSelection.length - 1,
  );
  const [loading, setLoading] = useState(false);

  // The options that were computed so far, so that only the options of
  // templates that were not seen before have to be requested. They are valid
  // as long as the published data does not change, as for the page itself.
  const [optionsCache] = useState(
    () =>
      new Map<string, ReactionOptions>(
        initialSelection.map((
          template,
          index,
        ) => [templateKey(template), initialOptions[index]]),
      ),
  );

  const canonicalUrl = "/scat-cs";

  // Only the response to the latest change is applied, so a slow response to
  // an earlier change cannot overwrite a newer selection.
  const latestRequest = useRef(0);

  const onChange = async (newSelection: Array<ReactionInformation>) => {
    const request = ++latestRequest.current;
    const templates = newSelection.map(({ options }) => options);
    const keys = templates.map(templateKey);
    const missing = keys.flatMap((key, index) =>
      optionsCache.has(key) ? [] : [index]
    );

    setLoading(true);
    try {
      const result = await searchAction(templates, missing);
      missing.forEach((index) => {
        const computed = result.options[index];
        if (computed === null) {
          throw new Error("The server did not return the requested options.");
        }
        optionsCache.set(keys[index], computed);
      });

      if (request === latestRequest.current) {
        // The selection is applied together with its options, so the picker
        // never offers choices that belong to another selection.
        setSelection(newSelection);
        setOptions(keys.map((key) => optionsCache.get(key)!));
        setMatches(result.matches);
        setSearchId((id) => id + 1);
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
              disabled={total === 0 && selection.length < 2}
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
            {total > 0 && (
              plotIds !== null
                ? (
                  <Button
                    component={Link}
                    href={`/scat-cs/inspect?ids=${plotIds.join(",")}`}
                    leftSection={<IconGraph />}
                    variant="light"
                  >
                    Plot selection
                  </Button>
                )
                : (
                  <Tooltip
                    label={`${total} cross sections match, and at most ${PLOT_SIZE} can be plotted. Narrow down your selection.`}
                  >
                    <div>
                      <Button
                        disabled
                        leftSection={<IconGraph />}
                        variant="light"
                      >
                        Plot selection
                      </Button>
                    </div>
                  </Tooltip>
                )
            )}
          </Group>
          <Fieldset legend="Search results">
            <Stack gap="xs">
              {total > 0 && (
                <Text size="sm" c="dimmed">
                  {total} cross {total === 1 ? "section" : "sections"} in{" "}
                  {sets.length} {sets.length === 1 ? "set" : "sets"}
                </Text>
              )}
              <CSTable
                key={searchId}
                sets={sets}
                loading={loading}
                loadItems={(setKey, page) =>
                  searchSetItemsAction(
                    selection.map(({ options }) => options),
                    setKey,
                    page,
                  )}
              />
            </Stack>
          </Fieldset>
        </Stack>
      </Container>
    </>
  );
};
