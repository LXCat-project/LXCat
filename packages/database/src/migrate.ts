// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from "fs";

const file = process.argv[3];

if (!file) {
  console.error("Please supply the file name as the only argument.");
  process.exit();
}

const set = JSON.parse(fs.readFileSync(file, { encoding: "utf8" }));

for (const process of set.processes) {
  if (process.data) {
    process.values = process.data;
    delete process.data;
  }
}

for (const state of Object.values<any>(set.states)) {
  if (!("type" in state)) {
    state.type = "simple";
    continue;
  }

  if (Array.isArray(state.electronic)) {
    // Check for singular states and simplify.
    if (state.electronic.length === 1) {
      state.electronic = state.electronic[0];

      // Check whether the state is unspecified and simplify.
      if (
        Object.keys(state.electronic).length === 1 && "e" in state.electronic
      ) {
        state.electronic = state.electronic.e;
        state.type = "unspecified";
      } else {
        if (Array.isArray(state.electronic.vibrational)) {
          const electronic = state.electronic;

          if (electronic.vibrational.length === 1) {
            electronic.vibrational = electronic.vibrational[0];

            if (
              Object.keys(electronic.vibrational).length === 1
              && "v" in electronic.vibrational
              && typeof electronic.vibrational.v === "string"
            ) {
              electronic.vibrational = electronic.vibrational.v;
            } else {
              if (Array.isArray(electronic.vibrational.rotational)) {
                const vibrational = electronic.vibrational;

                vibrational.rotational = vibrational.rotational.map(
                  (rotational: any) => {
                    if (
                      Object.keys(rotational).length === 1 && "J" in rotational
                      && typeof rotational.J === "string"
                    ) {
                      return rotational.J;
                    }
                    return rotational;
                  },
                );

                if (vibrational.rotational.length === 1) {
                  vibrational.rotational = vibrational.rotational[0];
                }
              }
            }
          } else {
            electronic.vibrational = electronic.vibrational.map(
              (vibrational: any) => {
                if ("rotational" in vibrational) {
                  console.error(
                    `Multi-level compound states are not supported: ${
                      JSON.stringify(state, null, 2)
                    }`,
                  );
                  process.exit();
                }
                if (
                  Object.keys(vibrational).length === 1 && "v" in vibrational
                  && typeof vibrational.v === "string"
                ) {
                  return vibrational.v;
                }
                return vibrational;
              },
            );
          }
        }
      }
    } else {
      // Check for multilevel compound states and collapse unspecified.
      state.electronic = state.electronic.map((electronic: any) => {
        if ("vibrational" in electronic) {
          console.error(
            `Multi-level compound states are not supported: ${
              JSON.stringify(state, null, 2)
            }`,
          );
          process.exit();
        }
        if (Object.keys(electronic).length === 1 && "e" in electronic) {
          return electronic.e;
        }
        return electronic;
      });
      // NOTE: We should do a check whether all elements are string, and if so
      //       convert the type to "Unspecified".
    }
  }
}

fs.writeFileSync(file, JSON.stringify(set), { encoding: "utf8" });
