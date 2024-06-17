// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

import { Element } from "./element.js";
import { Composition } from "./universal.js";

const extractElements = (
  entry: Composition[0],
): Array<Element> => {
  const element = entry[0];

  if (typeof element === "string") {
    return [element];
  } else {
    return element.flatMap((entry) => extractElements(entry));
  }
};

export const uniqueElementsInComposition = (
  composition: Composition,
): Array<Element> => [
  ...new Set(composition.flatMap((entry) => extractElements(entry))),
];
