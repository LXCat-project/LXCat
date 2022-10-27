import { Facets, SearchOptions } from "@lxcat/database/dist/cs/queries/public";
import { ReactionTypeTag } from "@lxcat/schema/dist/core/enumeration";
import { Box, Button } from "@mantine/core";
import {
  IconCopy,
  IconEye,
  IconPencil,
} from "@tabler/icons";
import { useState } from "react";
import { ReactionPicker } from "../shared/ReactionPicker";
import { StringsFilter } from "../shared/StringsFilter";
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

  function onSetChange(newSetSelection: string[]) {
    onChange({
      ...selection,
      set_name: newSetSelection,
    });
  }

  function onTagChange(newTagSelection: string[]) {
    onChange({
      ...selection,
      tag: newTagSelection,
    });
  }

  function onReset() {
    onChange({
      set_name: [],
      tag: [],
      species1: { particle: {} },
      species2: { particle: {} },
    });
  }

  const reactions = selection.reactions ?? [
  //   {
  //   rhs: [],
  //   lhs: [],
  //   reversible: true,
  //   type_tags: []
  // }
];
  function onReactionsChange(newReactions: SearchOptions["reactions"]) {
    console.log(newReactions)
    onChange({
      ...selection,
      reactions: newReactions,
    }, 'reactions');
  }
  const [editableReaction, setEditableReaction] = useState(reactions.length - 1); 

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
                    <ReactionPicker
                      consumes={{
                        entries: r.lhs.map((s, j) => {
                          return {
                            id: `${i}-c-${j}`,
                            data: {},
                            selected: s.state
                          }
                        }),
                        onAppend: () => {},
                        onRemove: () => {},
                        onUpdate: () => {},
                      }}
                      produces={{
                        entries: r.rhs.map((s, j) => {
                          return {
                            id: `${i}-c-${j}`,
                            data: {},
                            selected: s.state
                          }
                        }),
                        onAppend: () => {},
                        onRemove: () => {},
                        onUpdate: () => {},
                      }}
                      typeTags={{
                        data: Object.keys(ReactionTypeTag),
                        onChange: () => {}
                      }}
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
                  { rhs: [], lhs: [], reversible: false, type_tags: [] },
                ];
                onReactionsChange(newReactions);
                setEditableReaction(newReactions.length -1)
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
        <fieldset>
          <legend>Set</legend>
          <StringsFilter
            choices={facets.set_name}
            selection={selection.set_name}
            onChange={onSetChange}
          />
        </fieldset>
        <fieldset>
          <legend>Reaction type</legend>
          <StringsFilter
            // TODO order type tags alphabetically?
            choices={facets.tag}
            selection={selection.tag}
            onChange={onTagChange}
          />
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
