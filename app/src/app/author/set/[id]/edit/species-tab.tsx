// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PartialKeyedDocument } from "@lxcat/database/schema";
import { stateJSONSchema } from "@lxcat/schema/json-schema";
import { type AnySpecies, AnySpeciesSerializable } from "@lxcat/schema/species";
import {
  Accordion,
  ActionIcon,
  Button,
  Center,
  Group,
  Modal,
  ScrollArea,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrack, IconTrash } from "@tabler/icons-react";
import { JSONSchema7 } from "json-schema";
import { nanoid } from "nanoid";
import { useState } from "react";
import Latex from "react-latex-next";
import { MaybePromise } from "../../../../api/util";
import { generateSpeciesForm, SpeciesForm } from "./form-factory";
import { SpeciesNode, SpeciesPicker } from "./species-picker";
import classes from "./species-tab.module.css";

const getSpeciesMeta = (species: AnySpecies) => {
  const speciesMeta = {
    electronic: {
      anyOf: "0",
      vibrational: { anyOf: "0", rotational: { anyOf: "0" } },
    },
  };

  if (species.type !== "simple" && species.type !== "unspecified") {
    if (Array.isArray(species.electronic)) {
      speciesMeta.electronic.anyOf = "1";
    } else if (
      "vibrational" in species.electronic
      && species.electronic.vibrational
    ) {
      if (Array.isArray(species.electronic.vibrational)) {
        speciesMeta.electronic.vibrational.anyOf = "1";
      } else if (
        typeof species.electronic.vibrational === "string"
      ) {
        speciesMeta.electronic.vibrational.anyOf = "2";
      } else if ("rotational" in species.electronic.vibrational) {
        if (
          Array.isArray(species.electronic.vibrational.rotational)
        ) {
          speciesMeta.electronic.vibrational.rotational.anyOf = "1";
        } else if (
          typeof species.electronic.vibrational.rotational
            === "string"
        ) {
          speciesMeta.electronic.vibrational.rotational.anyOf = "2";
        }
      }
    }
  }

  return speciesMeta;
};

export const SpeciesTab = (
  { species, meta, onChange }: {
    species: PartialKeyedDocument["states"];
    meta: Record<string, any>;
    onChange: (
      species: PartialKeyedDocument["states"],
      meta: Record<string, any>,
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
        <Accordion variant="contained" chevronPosition="left">
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
                        delete meta[key];
                        return onChange(species, meta);
                      }}
                    >
                      <IconTrash />
                    </ActionIcon>
                  </Center>
                  <Accordion.Panel>
                    <SpeciesForm
                      typeMap={generateSpeciesForm(
                        stateJSONSchema as JSONSchema7,
                        `set.states.${key}`,
                      )}
                      basePath={`set.states.${key}`}
                    />
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
                  type: "simple",
                  particle: "",
                  charge: 0,
                },
              }, {
                ...meta,
                [id]: {
                  electronic: {
                    anyOf: "0",
                    vibrational: {
                      anyOf: "0",
                      rotational: { anyOf: "0" },
                    },
                  },
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
              const clonedMeta = { ...meta };

              for (const species of selectedSpecies) {
                clonedSpecies[species._key] = species.species.detailed;
                clonedMeta[species._key] = getSpeciesMeta(
                  species.species.detailed,
                );
              }

              onChange(clonedSpecies, clonedMeta);

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
