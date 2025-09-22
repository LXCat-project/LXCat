// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type EditedLTPDocument } from "@lxcat/schema";
import { AnySpeciesSerializable } from "@lxcat/schema/species";
import {
  Accordion,
  ActionIcon,
  Button,
  Center,
  Modal,
  ScrollArea,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { useState } from "react";
import Latex from "react-latex-next";
import { MaybePromise } from "../../../../api/util";
import { SpeciesInput } from "./species-input";
import { SpeciesNode, SpeciesPicker } from "./species-picker";
import classes from "./species-tab.module.css";
import accordionClasses from "./top-level-accordion.module.css";

export const SpeciesTab = (
  { species, onChange }: {
    species: EditedLTPDocument["states"];
    onChange: (
      species: EditedLTPDocument["states"],
    ) => MaybePromise<void>;
  },
) => {
  const [
    speciesPickerOpened,
    { open: openSpeciesPicker, close: closeSpeciesPicker },
  ] = useDisclosure(false);
  const [selectedSpecies, setSelectedSpecies] = useState<Array<SpeciesNode>>(
    [],
  );

  return (
    <Stack>
      <ScrollArea classNames={{ viewport: classes.speciesList }} type="auto">
        <Accordion
          classNames={accordionClasses}
          variant="contained"
          chevronPosition="left"
        >
          {Object.entries(species).map(
            ([key, state]) => {
              const parsed = AnySpeciesSerializable.safeParse(state);
              const controlNode = parsed.success
                ? parsed.data.serialize().latex
                : "...";

              return (
                <Accordion.Item key={key} value={key}>
                  <Center>
                    <Accordion.Control>
                      <Latex>{`$${controlNode}$`}</Latex>
                    </Accordion.Control>
                    <ActionIcon
                      style={{ marginRight: 10 }}
                      variant="subtle"
                      color="red"
                      onClick={() => {
                        delete species[key];
                        return onChange(species);
                      }}
                    >
                      <IconTrash />
                    </ActionIcon>
                  </Center>
                  <Accordion.Panel>
                    {

                        <SpeciesInput
                          initialState={state}
                          onChange={(value) =>
                            onChange({ ...species, [key]: value })}
                        />


                      // <SpeciesForm
                      //   typeMap={generateSpeciesForm(
                      //     stateJSONSchema as JSONSchema7,
                      //     `set.states.${key}`,
                      //   )}
                      //   basePath={`set.states.${key}`}
                      // />
                    }
                  </Accordion.Panel>
                </Accordion.Item>
              );
            },
          )}
        </Accordion>
      </ScrollArea>
      <Center>
        <Button.Group>
          <Button
            onClick={() => {
              const id = nanoid();
              onChange({
                ...species,
                [id]: {
                  type: "Atom",
                  composition: [["H", 1]],
                  charge: 0,
                },
              });
            }}
          >
            +
          </Button>
          <Button
            variant="light"
            onClick={openSpeciesPicker}
          >
            Add from database
          </Button>
        </Button.Group>
      </Center>
      <Modal
        opened={speciesPickerOpened}
        onClose={closeSpeciesPicker}
        title="Choose existing species from the database"
      >
        <Stack>
          <SpeciesPicker
            selected={selectedSpecies}
            setSelected={setSelectedSpecies}
          />
          <Button
            onClick={() => {
              const clonedSpecies = { ...species };

              for (const species of selectedSpecies) {
                clonedSpecies[species._key] = species.species.detailed;
              }

              onChange(clonedSpecies);

              closeSpeciesPicker();
              setSelectedSpecies([]);
            }}
          >
            Add
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
};
