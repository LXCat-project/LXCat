// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  StateChoices,
  StateDict,
} from "@lxcat/database/dist/shared/queries/state";
import { Button, Modal } from "@mantine/core";
import { useEffect, useState } from "react";
import { stateSelectionToSearchParam } from "../shared/StateFilter";
import { StatePicker } from "./StatePicker";

export const StatePickerModal = ({
  onSubmit,
}: {
  onSubmit: (picked: StateDict) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [filterChoices, setFilterChoies] = useState<StateChoices>({
    particle: {},
  });
  const [filterSelection, setFilterSelection] = useState<StateChoices>({
    particle: {},
  });
  const [choices, setChoices] = useState<StateDict>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    const afn = async () => {
      const url = "/api/states/choices";
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
    };
    afn();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (Object.keys(filterSelection.particle).length === 0) {
      setChoices({});
      return;
    }
    const afn = async () => {
      const searchParams = stateSelectionToSearchParam(filterSelection);
      const url = `/api/states?filter=${searchParams}`;
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

  const onLocalSubmit = (picked: StateDict) => {
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
        title="Pick state(s) from database"
        size="70%"
      >
        <StatePicker
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
