// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { FormattedReference } from "@/app/data/inspect/types";
import { type Reference } from "@lxcat/schema";
import { Stack, Text } from "@mantine/core";
import { ReferenceList } from "./reference-list";

const LXCAT_REFERENCES: Array<Reference> = [
  {
    author: [
      {
        given: "Emile",
        family: "Carbone",
      },
      {
        given: "Wouter",
        family: "Graef",
      },
      {
        given: "Gerjan",
        family: "Hagelaar",
      },
      {
        given: "Daan",
        family: "Boer",
      },
      {
        given: "Matthew M.",
        family: "Hopkins",
      },
      {
        given: "Jacob C.",
        family: "Stephens",
      },
      {
        given: "Benjamin T.",
        family: "Yee",
      },
      {
        given: "Sergey",
        family: "Pancheshnyi",
      },
      {
        given: "Jan",
        family: "Dijk",
        "non-dropping-particle": "van",
      },
      {
        given: "Leanne",
        family: "Pitchford",
      },
    ],
    "container-title": "Atoms",
    id: "atoms9010016",
    DOI: "10.3390/atoms9010016",
    URL: "https://doi.org/10.3390/atoms9010016",
    issue: "1",
    issued: {
      "date-parts": [[2021]],
    },
    title:
      "Data Needs for Modeling Low-Temperature Non-Equilibrium Plasmas: The LXCat Project, History, Perspectives and a Tutorial",
    type: "article-journal",
    volume: "9",
  },
  {
    author: [
      {
        given: "Leanne C.",
        family: "Pitchford",
      },
      {
        given: "Luis L.",
        family: "Alves",
      },
      {
        given: "Klaus",
        family: "Bartschat",
      },
      {
        given: "Stephen F.",
        family: "Biagi",
      },
      {
        given: "Marie-Claude",
        family: "Bordage",
      },
      {
        given: "Igor",
        family: "Bray",
      },
      {
        given: "Chris E.",
        family: "Brion",
      },
      {
        given: "Michael J.",
        family: "Brunger",
      },
      {
        given: "Laurence",
        family: "Campbell",
      },
      {
        given: "Alise",
        family: "Chachereau",
      },
      {
        given: "Bhaskar",
        family: "Chaudhury",
      },
      {
        given: "Loucas G.",
        family: "Christophorou",
      },
      {
        given: "Emile",
        family: "Carbone",
      },
      {
        given: "Nikolay A.",
        family: "Dyatko",
      },
      {
        given: "Christian M.",
        family: "Franck",
      },
      {
        given: "Dmitry V.",
        family: "Fursa",
      },
      {
        given: "Reetesh K.",
        family: "Gangwar",
      },
      {
        given: "Vasco",
        family: "Guerra",
      },
      {
        given: "Pascal",
        family: "Haefliger",
      },
      {
        given: "Gerjan J. M.",
        family: "Hagelaar",
      },
      {
        given: "Andreas",
        family: "Hoesl",
      },
      {
        given: "Yukikazu",
        family: "Itikawa",
      },
      {
        given: "Igor V.",
        family: "Kochetov",
      },
      {
        given: "Robert P.",
        family: "McEachran",
      },
      {
        given: "W. Lowell",
        family: "Morgan",
      },
      {
        given: "Anatoly P.",
        family: "Napartovich",
      },
      {
        given: "Vincent",
        family: "Puech",
      },
      {
        given: "Mohamed",
        family: "Rabie",
      },
      {
        given: "Lalita",
        family: "Sharma",
      },
      {
        given: "Rajesh",
        family: "Srivastava",
      },
      {
        given: "Allan D.",
        family: "Stauffer",
      },
      {
        given: "Jonathan",
        family: "Tennyson",
      },
      {
        given: "Jaime",
        family: "Urquijo",
        "non-dropping-particle": "de",
      },
      {
        given: "Jan",
        family: "Dijk",
        "non-dropping-particle": "van",
      },
      {
        given: "Larry A.",
        family: "Viehland",
      },
      {
        given: "Mark C.",
        family: "Zammit",
      },
      {
        given: "Oleg",
        family: "Zatsarinny",
      },
      {
        given: "Sergey",
        family: "Pancheshnyi",
      },
    ],
    "container-title": "Plasma Processes and Polymers",
    id: "https://doi.org/10.1002/ppap.201600098",
    DOI: "10.1002/ppap.201600098",
    URL: "https://doi.org/10.1002/ppap.201600098",
    issue: "1-2",
    issued: {
      "date-parts": [[2017]],
    },
    page: "1600098",
    title:
      "LXCat: an Open-Access, Web-Based Platform for Data Needed for Modeling Low Temperature Plasmas",
    type: "article-journal",
    volume: "14",
  },
  {
    author: [
      {
        given: "S.",
        family: "Pancheshnyi",
      },
      {
        given: "S.",
        family: "Biagi",
      },
      {
        given: "M.C.",
        family: "Bordage",
      },
      {
        given: "G.J.M.",
        family: "Hagelaar",
      },
      {
        given: "W.L.",
        family: "Morgan",
      },
      {
        given: "A.V.",
        family: "Phelps",
      },
      {
        given: "L.C.",
        family: "Pitchford",
      },
    ],
    "container-title": "Chemical Physics",
    id: "PANCHESHNYI2012148",
    issued: {
      "date-parts": [[2012]],
    },
    note:
      "Chemical Physics of Low-Temperature Plasmas (in honour of Prof Mario Capitelli)",
    page: "148-153",
    title:
      "The LXCat project: Electron scattering cross sections and swarm parameters for low temperature plasma modeling",
    type: "article-journal",
    volume: "398",
    DOI: "10.1016/j.chemphys.2011.04.020",
    URL: "https://doi.org/10.1016/j.chemphys.2011.04.020",
  },
];

const FORMATTED_LXCAT_REFERENCES: Array<FormattedReference> = [
  {
    id: "atoms9010016",
    ref:
      "Carbone, E., Graef, W., Hagelaar, G., Boer, D., Hopkins, M. M., Stephens, J. C., Yee, B. T., Pancheshnyi, S., van Dijk, J., & Pitchford, L. (2021). Data Needs for Modeling Low-Temperature Non-Equilibrium Plasmas: The LXCat Project, History, Perspectives and a Tutorial. Atoms, 9(1). https://doi.org/10.3390/atoms9010016\n",
    url: "https://doi.org/10.3390/atoms9010016",
  },
  {
    id: "https://doi.org/10.1002/ppap.201600098",
    ref:
      "Pitchford, L. C., Alves, L. L., Bartschat, K., Biagi, S. F., Bordage, M.-C., Bray, I., Brion, C. E., Brunger, M. J., Campbell, L., Chachereau, A., Chaudhury, B., Christophorou, L. G., Carbone, E., Dyatko, N. A., Franck, C. M., Fursa, D. V., Gangwar, R. K., Guerra, V., Haefliger, P., … Pancheshnyi, S. (2017). LXCat: an Open-Access, Web-Based Platform for Data Needed for Modeling Low Temperature Plasmas. Plasma Processes and Polymers, 14(1–2), 1600098. https://doi.org/10.1002/ppap.201600098\n",
    url: "https://doi.org/10.1002/ppap.201600098",
  },
  {
    id: "PANCHESHNYI2012148",
    ref:
      "Pancheshnyi, S., Biagi, S., Bordage, M. C., Hagelaar, G. J. M., Morgan, W. L., Phelps, A. V., & Pitchford, L. C. (2012). The LXCat project: Electron scattering cross sections and swarm parameters for low temperature plasma modeling. Chemical Physics, 398, 148–153. https://doi.org/10.1016/j.chemphys.2011.04.020\n",
    url: "https://doi.org/10.1016/j.chemphys.2011.04.020",
  },
];

export const HowToCite = (
  { references }: { references: Array<FormattedReference> },
) => {
  return (
    <Stack>
      {references.length > 0
        && (
          <div>
            <Text fw={700} size="lg" mb="xs">
              How to reference the selected data
            </Text>
            <ReferenceList references={references} />
          </div>
        )}
      <div>
        <Text fw={700} size="lg" mb="xs">How to reference LXCat</Text>
        <ReferenceList references={FORMATTED_LXCAT_REFERENCES} />
      </div>
    </Stack>
  );
};
