// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Element } from "@lxcat/schema/species";
import { Grid, GridCol } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { PeriodicSearchResult } from "../../../../packages/database/dist/elements/queries";
import { MaybePromise } from "../api/util";
import { getSetHeaderAction } from "./actions";
import { elements } from "./elements-processed";
import { PeriodicElement } from "./periodic-element";

export const PeriodicTable = (
  { activeElements, onChange }: {
    activeElements: Set<Element>;
    onChange: (setHeaders: Array<PeriodicSearchResult>) => MaybePromise<void>;
  },
) => {
  const [selected, setSelected] = useState<Array<boolean>>(
    elements.map(() => false),
  );

  useEffect(() => {
    getSetHeaderAction(
      elements.filter((_, idx) => selected[idx]).map(({ symbol }) =>
        Element.parse(symbol)
      ),
    ).then(onChange);
  }, [selected, onChange]);

  const disabled = useMemo(() =>
    elements.map((element) => {
      const result = Element.safeParse(element.symbol);
      return result.success
        ? !activeElements.has(result.data)
        : true;
    }), [activeElements]);

  return (
    <Grid
      id="periodic-table"
      columns={18}
      gutter={0}
      style={{ width: 1080 }}
    >
      {elements.map((element, idx) => {
        return (
          <GridCol key={element.symbol} span={1} offset={element.offset}>
            <PeriodicElement
              summary={element}
              selected={selected[idx]}
              onClick={() => {
                const copy = [...selected];
                copy[idx] = !copy[idx];
                setSelected(copy);
              }}
              disabled={disabled[idx]}
            />
          </GridCol>
        );
      })}
    </Grid>
  );
};
