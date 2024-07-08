// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { Element } from "@lxcat/schema/species";
import { Grid, GridCol } from "@mantine/core";
import { useMemo, useState } from "react";
import { getSetHeaderAction } from "./actions";
import { elements } from "./elements-processed";
import { PeriodicElement } from "./periodic-element";

export const PeriodicTable = (
  { activeElements }: { activeElements: Set<Element> },
) => {
  const [selected, setSelected] = useState<Array<boolean>>(
    elements.map(() => false),
  );

  getSetHeaderAction(
    elements.filter((_, idx) => selected[idx]).map(({ symbol }) =>
      Element.parse(symbol)
    ),
  ).then((test) => console.log(test));

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
      style={{ width: 1080, marginTop: 50 }}
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
