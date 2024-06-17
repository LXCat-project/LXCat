// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Element } from "@lxcat/schema/species";
import { Database } from "arangojs";
import { Unit } from "true-myth";
import Result, { err, ok } from "true-myth/result";

export const setupCompositionCollections = async (
  db: Database,
): Promise<Result<Unit, Error>> => {
  const compositionCollection = await createCompositionCollection(db);
  if (compositionCollection.isErr) return compositionCollection;

  const elementCollection = await createElementCollection(db);
  if (elementCollection.isErr) return elementCollection;

  const edgeCol = await createContainsElementCollection(db);
  if (edgeCol.isErr) return edgeCol;

  for (const element of Element.options) {
    const result = await db.query(
      "INSERT @object INTO @@collection LET r = NEW return r._id",
      { object: { _key: element }, "@collection": "Element" },
    );
    if (!result.hasNext) {
      return err(new Error(`Could not add element ${element}.`));
    }
  }

  return ok();
};

const createCompositionCollection = async (
  db: Database,
): Promise<Result<Unit, Error>> => {
  const compositionCollection = db.collection("Composition");

  try {
    await compositionCollection.create();
  } catch (error) {
    return err(error as Error);
  }

  console.log("Composition collection created");
  return ok();
};

const createElementCollection = async (
  db: Database,
): Promise<Result<Unit, Error>> => {
  const elementCollection = db.collection("Element");

  try {
    await elementCollection.create();
  } catch (error) {
    return err(error as Error);
  }

  console.log("Element collection created");
  return ok();
};

const createContainsElementCollection = async (
  db: Database,
): Promise<Result<Unit, Error>> => {
  try {
    await db.createEdgeCollection("ContainsElement");
  } catch (error) {
    return err(error as Error);
  }

  return ok();
};
