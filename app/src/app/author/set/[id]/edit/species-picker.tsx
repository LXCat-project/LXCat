// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { SerializedSpecies } from "@lxcat/database/schema";
import { createStyles, Group, px, Text } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useState } from "react";
import useSWR from "swr";
import { Latex } from "../../../../../shared/Latex";

export type SpeciesNode = {
  _key: string;
  species: SerializedSpecies;
  hasChildren: boolean;
};

const useStyles = createStyles(() => ({
  expandIcon: {
    transition: "transform 0.2s ease",
  },
  expandIconRotated: {
    transform: "rotate(90deg)",
  },
}));

export type SpeciesPickerImplProps = {
  records: Array<SpeciesNode>;
  selected: Array<SpeciesNode>;
  setSelected: (species: Array<SpeciesNode>) => void;
  nested?: boolean;
  loading?: boolean;
  leftPadding?: number;
  nestedPicker?: (record: SpeciesNode) => React.ReactNode;
};

const SpeciesPickerImpl = (
  {
    records,
    selected,
    setSelected,
    nested,
    loading,
    leftPadding,
    nestedPicker,
  }: SpeciesPickerImplProps,
) => {
  const [expanded, setExpanded] = useState<Array<string>>([]);
  const { cx, classes } = useStyles();

  return (
    <DataTable
      selectedRecords={selected}
      onSelectedRecordsChange={setSelected}
      withBorder={!(nested ?? false)}
      withColumnBorders
      noHeader={nested ?? false}
      highlightOnHover
      borderRadius={nested ? undefined : "sm"}
      idAccessor="_key"
      minHeight={loading ? 100 : undefined}
      columns={[
        {
          title: "Species",
          accessor: "_key",
          noWrap: true,
          render: ({ _key, species, hasChildren }) => (
            <Group
              style={{
                paddingLeft: (hasChildren ? 0 : px("1.6rem"))
                  + (leftPadding ?? 0),
              }}
              spacing="xs"
            >
              {hasChildren
                && (
                  <IconChevronRight
                    size="0.9rem"
                    className={cx(classes.expandIcon, {
                      [classes.expandIconRotated]: expanded.includes(_key),
                    })}
                  />
                )}
              <Latex>{species.serialized.latex}</Latex>
            </Group>
          ),
        },
      ]}
      records={records}
      rowExpansion={nestedPicker && {
        allowMultiple: true,
        expanded: {
          recordIds: expanded,
          onRecordIdsChange: setExpanded,
        },
        content: ({ record }) =>
          record.hasChildren
            ? nestedPicker(record)
            : null,
      }}
      fetching={loading ?? false}
    />
  );
};

type ChildSpeciesPickerProps = {
  _key: string;
  selected: Array<SpeciesNode>;
  setSelected: (species: Array<SpeciesNode>) => void;
  leftPadding?: number;
};

const speciesFetcher = async (url: string): Promise<Array<SpeciesNode>> =>
  fetch(url).then(res => res.json());

const ChildSpeciesPicker = (
  { _key, selected, setSelected, leftPadding }: ChildSpeciesPickerProps,
) => {
  const { data, error, isLoading } = useSWR(
    `/api/species/children?id=${_key}`,
    speciesFetcher,
  );

  if (error) return <Text>{`Invalid state key: ${_key}.`}</Text>;

  return (
    <SpeciesPickerImpl
      records={data ?? []}
      selected={selected}
      setSelected={setSelected}
      nested
      loading={isLoading}
      leftPadding={leftPadding}
      nestedPicker={(record) => (
        <ChildSpeciesPicker
          _key={record._key}
          selected={selected}
          setSelected={setSelected}
          leftPadding={(leftPadding ?? 0) + INDENT}
        />
      )}
    />
  );
};

const INDENT = px("0.3rem");

export type SpeciesPickerProps = {
  selected: Array<SpeciesNode>;
  setSelected: (selected: Array<SpeciesNode>) => void;
};

export const SpeciesPicker = (
  { selected, setSelected }: SpeciesPickerProps,
) => {
  const { data, error, isLoading } = useSWR("/api/species", speciesFetcher);

  if (error) return <Text>Could not fetch top-level states.</Text>;

  return (
    <SpeciesPickerImpl
      records={data ?? []}
      selected={selected}
      setSelected={setSelected}
      loading={isLoading}
      nestedPicker={(record) => (
        <ChildSpeciesPicker
          _key={record._key}
          selected={selected}
          setSelected={setSelected}
          leftPadding={INDENT}
        />
      )}
    />
  );
};
