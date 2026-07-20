// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Reversible, StateProcess } from "@lxcat/database/item/picker";
import {
  OMIT_CHILDREN_KEY,
  StateLeaf,
  StatePath,
  StateTree,
} from "@lxcat/database/shared";
import { ReactionTypeTag } from "@lxcat/schema/process";
import { MantineStyleProp } from "@mantine/core";
import useSWRImmutable from "swr/immutable";
import { StateSelect } from "./state-select";

export interface SWRReactionOptions {
  consumes: Array<StateLeaf>;
  produces: Array<StateLeaf>;
  typeTags: Array<ReactionTypeTag>;
  reversible: Reversible;
  csSets: Set<string>;
}

const fetchStateTreeForSelection = async (
  stateProcess: StateProcess,
  consumes: Array<StateLeaf>,
  produces: Array<StateLeaf>,
  typeTags: Array<ReactionTypeTag>,
  reversible: Reversible,
  setIds: Set<string>,
): Promise<StateTree> =>
  (
    await fetch(
      `/api/states/partaking?${new URLSearchParams({
        stateProcess: stateProcess,
        consumes: JSON.stringify(consumes),
        produces: JSON.stringify(produces),
        typeTags: JSON.stringify(typeTags),
        reversible,
        setIds: JSON.stringify([...setIds]),
      })}`,
    )
  ).json();
async function stateFetcher({
  process,
  consumes,
  produces,
  typeTags,
  reversible,
  csSets,
}: SWRReactionOptions & { process: StateProcess }) {
  return fetchStateTreeForSelection(
    process,
    consumes,
    produces,
    typeTags,
    reversible,
    csSets,
  );
}

const getLatexFromTree = (tree: StateTree, path: StatePath) => {
  let latex = "";

  if (path.particle) {
    const particle = tree[path.particle];
    latex += particle.latex;
    if (
      particle.children
      && path.electronic
      && path.electronic !== OMIT_CHILDREN_KEY
    ) {
      const electronic = particle.children[path.electronic];
      latex += `\\left(${electronic.latex}`;
      if (
        electronic.children
        && path.vibrational
        && path.vibrational !== OMIT_CHILDREN_KEY
      ) {
        const vibrational = electronic.children[path.vibrational];
        latex += `\\left(v=${vibrational.latex}`;
        if (
          vibrational.children
          && path.rotational
          && path.rotational !== OMIT_CHILDREN_KEY
        ) {
          latex += `\\left(J=${
            vibrational.children[path.rotational].latex
          }\\right)`;
        }
        latex += "\\right)";
      }
      latex += "\\right)";
    }
  }

  return latex;
};

export interface SWRStateSelectProps {
  selection: SWRReactionOptions;
  process: StateProcess;
  selected: StatePath;
  onChange: (selected: StatePath, latex: string) => void | Promise<void>;
  style?: MantineStyleProp;
}

export const SWRStateSelect = ({
  selection,
  process,
  onChange,
  ...props
}: SWRStateSelectProps) => {
  const { data: tree, error } = useSWRImmutable(
    { ...selection, csSets: [...selection.csSets], process },
    stateFetcher,
    {
      keepPreviousData: true,
    },
  );

  if (!tree) {
    return <div>{JSON.stringify(error, null, 2)}</div>;
  }

  return (
    <StateSelect
      data={tree}
      onChange={(selected: StatePath) =>
        onChange(selected, getLatexFromTree(tree, selected))}
      {...props}
    />
  );
};
