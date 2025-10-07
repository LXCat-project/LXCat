// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { UnstyledButton } from "@mantine/core";
import clsx from "clsx";
import { MaybePromise } from "../api/util";
import { ElementSummary } from "./elements-processed";

import classes from "./element.module.css";

export const PeriodicElement = (
  { summary, selected, onClick, disabled }: {
    summary: ElementSummary;
    selected: boolean;
    onClick: () => MaybePromise<void>;
    disabled?: boolean;
  },
) => {
  return (
    <UnstyledButton
      disabled={disabled}
      className={clsx([
        classes.periodicElement,
        {
          [classes.selected]: selected,
        },
      ])}
      style={{ marginTop: summary.padTop ? 20 : 0 }}
      onClick={onClick}
    >
      <div className={classes.topLeft}>
        {summary.number}
      </div>
      <div className={classes.center}>{summary.symbol}</div>
      <div className={classes.bottom}>{summary.name}</div>
    </UnstyledButton>
  );
};
