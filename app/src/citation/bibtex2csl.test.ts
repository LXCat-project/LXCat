// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, test } from "bun:test";
import { bibtex2csl } from "./bibtex2csl";

describe("bibtex2csl()", () => {
  test("should return object with label and csl record", async () => {
    const input = `
        
@Article{atoms9010016,
    AUTHOR = {Carbone, Emile and Graef, Wouter and Hagelaar, Gerjan and Boer, Daan and Hopkins, Matthew M. and Stephens, Jacob C. and Yee, Benjamin T. and Pancheshnyi, Sergey and van Dijk, Jan and Pitchford, Leanne},
    TITLE = {Data Needs for Modeling Low-Temperature Non-Equilibrium Plasmas: The LXCat Project, History, Perspectives and a Tutorial},
    JOURNAL = {Atoms},
    VOLUME = {9},
    YEAR = {2021},
    NUMBER = {1},
    ARTICLE-NUMBER = {16},
    URL = {https://www.mdpi.com/2218-2004/9/1/16},
    ISSN = {2218-2004},
    ABSTRACT = {Technologies based on non-equilibrium, low-temperature plasmas are ubiquitous in today’s society. Plasma modeling plays an essential role in their understanding, development and optimization. An accurate description of electron and ion collisions with neutrals and their transport is required to correctly describe plasma properties as a function of external parameters. LXCat is an open-access, web-based platform for storing, exchanging and manipulating data needed for modeling the electron and ion components of non-equilibrium, low-temperature plasmas. The data types supported by LXCat are electron- and ion-scattering cross-sections with neutrals (total and differential), interaction potentials, oscillator strengths, and electron- and ion-swarm/transport parameters. Online tools allow users to identify and compare the data through plotting routines, and use the data to generate swarm parameters and reaction rates with the integrated electron Boltzmann solver. In this review, the historical evolution of the project and some perspectives on its future are discussed together with a tutorial review for using data from LXCat.},
    DOI = {10.3390/atoms9010016}
    }
    
    `;
    const result = await bibtex2csl(input);
    const expected = {
      Carbone2021Data: {
        DOI: "10.3390/atoms9010016",
        ISSN: "2218-2004",
        URL: "https://www.mdpi.com/2218-2004/9/1/16",
        author: [
          { given: "Emile", family: "Carbone" },
          { given: "Wouter", family: "Graef" },
          { given: "Gerjan", family: "Hagelaar" },
          { given: "Daan", family: "Boer" },
          { given: "Matthew M.", family: "Hopkins" },
          { given: "Jacob C.", family: "Stephens" },
          { given: "Benjamin T.", family: "Yee" },
          { given: "Sergey", family: "Pancheshnyi" },
          { given: "Jan", family: "Dijk", "non-dropping-particle": "van" },
          { given: "Leanne", family: "Pitchford" },
        ],
        "container-title": "Atoms",
        id: "atoms9010016",
        "citation-key": "atoms9010016",
        issue: "1",
        issued: { "date-parts": [[2021]] },
        title:
          "Data Needs for Modeling Low-Temperature Non-Equilibrium Plasmas: The LXCat Project, History, Perspectives and a Tutorial",
        type: "article-journal",
        volume: "9",
      },
    };
    expect(result as unknown).toEqual(expected);
  });
});
