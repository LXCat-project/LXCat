import {
  Facets,
  Reversible,
  SearchOptions,
} from "@lxcat/database/dist/cs/queries/public";
import { Box, Button } from "@mantine/core";
import { IconCopy, IconEye, IconPencil } from "@tabler/icons";
import { useState } from "react";
import { StatefulReactionPicker } from "../shared/StatefulReactionPicker";
import { ReactionSummary } from "./ReactionSummary";

export const FilterComponent = ({
  facets,
  selection,
  onChange,
}: {
  facets: Facets;
  selection: SearchOptions;
  onChange: (selection: SearchOptions, event?: string) => void;
}) => {
  const hasAnySelection = Object.values(selection).some(
    (s) =>
      (Array.isArray(s) && s.length > 0) ||
      (typeof s === "object" && Object.keys(s).length > 0)
  );

  function onReset() {
    onChange({
      // TODO dedup packages/database/src/cs/queries/public.ts:defaultSearchOptions()
      reactions: [
        {
          consumes: [],
          produces: [],
          type_tags: [],
          reversible: Reversible.Both,
          set: [],
        },
      ],
    });
  }

  const reactions =
    selection.reactions ??
    [
      //   {
      //   rhs: [],
      //   lhs: [],
      //   reversible: true,
      //   type_tags: []
      // }
    ];
  function onReactionsChange(newReactions: SearchOptions["reactions"]) {
    console.log(newReactions);
    onChange(
      {
        ...selection,
        reactions: newReactions,
      },
      "reactions"
    );
  }
  const [editableReaction, setEditableReaction] = useState(
    reactions.length - 1
  );

  console.log(facets, selection);
  return (
    <div>
      <div style={{ display: "flex" }}>
        <fieldset style={{ flexGrow: 1 }}>
          <legend>Reaction</legend>
          <ul>
            {reactions.map((r, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {i == editableReaction ? (
                  <>
                    <StatefulReactionPicker
                      onChange={function (
                        consumes,
                        produces,
                        type_tags,
                        reversible,
                        set
                      ) {
                        console.log(arguments);
                        const newReactionSelection = [...selection.reactions];
                        newReactionSelection[i] = {
                          consumes,
                          produces,
                          reversible,
                          type_tags,
                          set: Array.from(set),
                        };
                        onReactionsChange(newReactionSelection);
                      }}
                      initialValues={
                        facets.reactions[i]
                          ? {
                              lhs: r.consumes.map((selected, j) => {
                                return {
                                  selected,
                                  data: facets.reactions[i].consumes[j],
                                };
                              }),
                              rhs: r.produces.map((selected, j) => {
                                return {
                                  selected,
                                  data: facets.reactions[i].produces[j],
                                };
                              }),
                              reversible: facets.reactions[i].reversible,
                              selectedReversible: r.reversible,
                              selectedTags: r.type_tags,
                              typeTags: facets.reactions[i].typeTags,
                              csSets: facets.reactions[i].set,
                              selectedCsSets: new Set(r.set),
                            }
                          : undefined
                      }
                    />
                    <Button.Group>
                      <Button
                        variant="subtle"
                        title="Remove reaction"
                        onClick={() => {
                          const newReactions = [...reactions];
                          newReactions.splice(i, 1);
                          onReactionsChange(newReactions);
                        }}
                      >
                        -
                      </Button>
                      <Button
                        variant="subtle"
                        title="Clone reaction"
                        onClick={() => {
                          const newReactions = [
                            ...reactions,
                            { ...reactions[i] },
                          ];
                          onReactionsChange(newReactions);
                        }}
                      >
                        <IconCopy size={16} />
                      </Button>
                      <Button
                        variant="subtle"
                        title="Toggle view mode"
                        onClick={() => {
                          setEditableReaction(-1);
                        }}
                      >
                        <IconEye size={16} />
                      </Button>
                    </Button.Group>
                  </>
                ) : (
                  <>
                    <ReactionSummary
                      lhs={[]}
                      rhs={[]}
                      reversible={false}
                      type_tags={[]}
                    />
                    <Button
                      variant="subtle"
                      title="Edit"
                      onClick={() => {
                        setEditableReaction(i);
                      }}
                    >
                      <IconPencil size={16} />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <Box sx={{ display: "flex", justifyContent: "end" }}>
            <Button
              title="Add reaction filter"
              onClick={() => {
                const newReactions = [
                  ...reactions,
                  {
                    consumes: [],
                    produces: [],
                    reversible: Reversible.Both,
                    type_tags: [],
                    set: [],
                  },
                ];
                onReactionsChange(newReactions);
                setEditableReaction(newReactions.length - 1);
              }}
            >
              +
            </Button>
          </Box>
          <div>
            Examples:{" "}
            <Button
              variant="subtle"
              onClick={() => {
                // TODO get reaction for Ar from db
                onReactionsChange([]);
              }}
            >
              Argon
            </Button>
          </div>
        </fieldset>
      </div>
      <div>
        <Button variant="outline" disabled={!hasAnySelection} onClick={onReset}>
          Clear selection
        </Button>
      </div>
    </div>
  );
};
