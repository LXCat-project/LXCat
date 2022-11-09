// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  Facets,
  SearchOptions,
  defaultSearchOptions,
} from "@lxcat/database/dist/cs/queries/public";
import { Button, Modal } from "@mantine/core";
import { useEffect, useState } from "react";
import { stateSelectionToSearchParam } from "../shared/StateFilter";
import { Picker, Picked } from "./Picker";

export const PickerModal = ({
  onSubmit,
}: {
  onSubmit: (picked: Picked) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [filterChoices, setFilterChoies] = useState<Facets>({
    set_name: [],
    species1: { particle: {} },
    species2: { particle: {} },
    tag: [],
  });
  const [filterSelection, setFilterSelection] = useState<SearchOptions>(
    defaultSearchOptions()
  );
  const [choices, setChoices] = useState<Picked>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const afn = async () => {
      // TODO implement api route that returns filter facets (aka choices) for cross sections that are public and drafts of author
      // TODO pass filter selection to url
      const url = "/api/author/scat-cs/choices";
      const headers = new Headers({
        Accept: "application/json",
        "Content-Type": "application/json",
      });
      const res = await fetch(url, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setFilterChoies(data);
      }
      // TODO warn user about failed fetch
    };
    afn();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    // TODO If filterSelection is empty then set choices to []
    const afn = async () => {
      const searchParams = new URLSearchParams({
        species1: stateSelectionToSearchParam(filterSelection.species1),
        species2: stateSelectionToSearchParam(filterSelection.species2),
      });
      filterSelection.tag.forEach((t) => searchParams.append("tag", t));
      filterSelection.set_name.forEach((t) =>
        searchParams.append("set_name", t)
      );
      const url = `/api/author/scat-cs?${searchParams.toString()}`;
      const headers = new Headers({
        Accept: "application/json",
        "Content-Type": "application/json",
      });
      const res = await fetch(url, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setChoices(data);
      }
      // TODO warn user about failed fetch
    };
    afn();
  }, [open, filterSelection]);

  const onLocalSubmit = (picked: Picked) => {
    setOpen(false);
    onSubmit(picked);
  };

  return (
    <>
      <Button type="button" variant="light" onClick={() => setOpen(true)}>
        Pick from database
      </Button>
      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Pick cross section(s) from database"
        size="90%"
      >
        <Picker
          filterChoices={filterChoices}
          filterSelection={filterSelection}
          setFilterSelection={setFilterSelection}
          choices={choices}
          onSubmit={onLocalSubmit}
        />
      </Modal>
    </>
  );
};
