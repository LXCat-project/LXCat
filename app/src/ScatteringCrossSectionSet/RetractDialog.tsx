// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Link from "next/link";
import { useState } from "react";
import { Dialog } from "../shared/Dialog";
import { deleteSet } from "./client";

interface Props {
  isOpened: boolean;
  selectedSetId: string;
  onClose: (error?: string) => void;
}

export const RetractDialog = ({ isOpened, selectedSetId, onClose }: Props) => {
  const [retractMessage, setRetractMessage] = useState("");

  async function onSubmit(pressedButton: string) {
    const confirmed = pressedButton === "default";
    if (confirmed) {
      const result = await deleteSet(selectedSetId, retractMessage);

      if (typeof result === "string") {
        onClose(result);
        return;
      }
    }

    onClose();
  }

  return (
    <Dialog isOpened={isOpened} onSubmit={onSubmit}>
      <form method="dialog">
        <div>
          Please describe why{" "}
          <Link href={`/scat-css/${selectedSetId}`}>this set</Link>{" "}
          should be retracted.
        </div>
        <textarea
          cols={80}
          rows={5}
          value={retractMessage}
          onChange={(event) => setRetractMessage(event.target.value)}
        >
        </textarea>
        <div>
          Users visiting{" "}
          <Link href={`/scat-css/${selectedSetId}`}>the page</Link>{" "}
          will see this description.
        </div>
        <button value="cancel">Cancel</button>
        <button value="default" type="submit">
          Retract
        </button>
      </form>
    </Dialog>
  );
};
