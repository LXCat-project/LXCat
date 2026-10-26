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
import { MatchingSet } from "../../cs/matching-set";
import { searchAction, searchSetItemsAction } from "./actions";

interface Props {
  sets: Array<MatchingSet>;
  total: number;
  /** The ids of all matching cross sections, unless there are too many. */
  plotIds: Array<string> | null;
  options: SearchOptions;
  selection: Array<ReactionTemplate>;
}

/** The options of a template only depend on the template itself. */
const templateKey = (
  { consumes, produces, typeTags, reversible, set }: ReactionTemplate,
) => JSON.stringify([consumes, produces, typeTags, reversible, set]);

export const CSClient: NextPage<Props> = ({
  sets: initialSets,
  total: initialTotal,
  plotIds: initialPlotIds,
  options: initialOptions,
  selection: initialSelection,
}) => {
  const [sets, setSets] = useState(initialSets);
  const [total, setTotal] = useState(initialTotal);
  const [plotIds, setPlotIds] = useState(initialPlotIds);
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

  const templates = selection.map(({ options }) => options);

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
        setSets(result.sets);
        setTotal(result.total);
        setPlotIds(result.plotIds);
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
                    style={{ textDecorationLine: "none" }}
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
                  {total} cross sections in {sets.length}{" "}
                  {sets.length === 1 ? "set" : "sets"}
                </Text>
              )}
              <CSTable
                key={searchId}
                sets={sets}
                loading={loading}
                loadItems={(setKey, page) =>
                  searchSetItemsAction(templates, setKey, page)}
              />
            </Stack>
          </Fieldset>
        </Stack>
      </Container>
    </>
  );
};
