// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Database } from "arangojs";
import { CreateDatabaseOptions } from "arangojs/database.js";
import { Result } from "true-myth";
import { err, ok } from "true-myth/result";
import {
  addOrganization,
  addSession,
  addUser,
  dropOrganization,
  dropSession,
  dropUser,
  getAffiliations,
  getSessionAndUser,
  getUserByAccount,
  getUserByEmail,
  getUserByKey,
  linkAccount,
  listContributors,
  listOrganizations,
  listUsers,
  makeAdmin,
  setAffiliations,
  stripAffiliations,
  toggleRole,
  unlinkAccount,
  updateSession,
  updateUser,
} from "./auth/queries.js";
import {
  getAvailableTypeTags,
  getCSIdByReactionTemplate,
  getCSSets,
  getPartakingStateSelection,
  getReversible,
  getSearchOptions,
  getStateSelection,
} from "./cs/picker/queries/public.js";
import {
  byOrgAndId,
  byOwnerAndId as itemByOwnerAndId,
  getVersionInfo as getItemVersionInfo,
  searchOwned,
} from "./cs/queries/author-read.js";
import { byId, byIds, csHistory, getCSHeadings } from "./cs/queries/public.js";
import {
  createCS,
  createDraftCS,
  deleteCS,
  dropReferencesFromExcluding,
  isDraftless,
  isPartOf,
  publish as publishItem,
  updateCS,
  updateDraftCS,
  updateVersionStatus as updateItemVersionStatus,
} from "./cs/queries/write.js";
import {
  byOwnerAndId,
  getVersionInfo as getSetVersionInfo,
  isOwnerOfSet,
  listOwnedSets,
} from "./css/queries/author-read.js";
import {
  createDraftSet,
  createSet,
  deleteSet,
  doesPublishingEffectOtherSets,
  draftItemsFromSet,
  isDraftlessSet,
  publish as publishSet,
  removeDraftUnchecked,
  retractSetUnchecked,
  updateDraftSet,
  updateSet,
  updateVersionStatus as updateSetVersionStatus,
} from "./css/queries/author-write.js";
import { getSetAffiliation } from "./css/queries/get-affiliation.js";
import { getNumItemsInSet } from "./css/queries/get-num-items-in-set.js";
import {
  activeSetOfArchivedSet,
  byId as setById,
  getItemIdsInSet,
  listSets,
  setHistory,
} from "./css/queries/public.js";
import {
  getActiveElements,
  getSetHeaderByElements,
} from "./elements/queries.js";
import { setupCompositionCollections } from "./setup/composition.js";
import { setupCrossSectionCollections } from "./setup/cs.js";
import { setupDatabase } from "./setup/db.js";
import { setupSharedCollections } from "./setup/shared.js";
import { setupUserCollections } from "./setup/users.js";
import {
  insertAtom,
  insertComposition,
  insertDocument,
  insertEdge,
  insertMolecule,
  insertReactionWithDict,
  insertReferenceDict,
  insertState,
  insertStateDict,
  insertStateTree,
  insertUnspecified,
  upsertDocument,
} from "./shared/queries.js";
import {
  getOrganizationByName,
  upsertOrganization,
} from "./shared/queries/organization.js";
import { findReactionId } from "./shared/queries/reaction.js";
import {
  getReferenceKeyByDOI,
  getReferences,
  getReferencesForSelection,
} from "./shared/queries/reference.js";
import {
  getSpeciesChildren,
  getTopLevelSpecies,
} from "./shared/queries/species.js";

export class LXCatDatabase {
  protected db: Database;

  protected constructor(db: Database) {
    this.db = db;
  }

  public static async setup(
    system: Database,
    name: string,
    options?: CreateDatabaseOptions,
  ): Promise<Result<LXCatDatabase, Error>> {
    let db: Database;

    if (await system.database(name).exists()) {
      db = system.database(name);
    } else {
      const dbResult = await setupDatabase(system, name, options);

      if (dbResult.isErr) {
        return err(dbResult.error);
      }

      db = dbResult.value;
    }

    await Promise.all([
      setupUserCollections(db),
      setupSharedCollections(db),
      setupCompositionCollections(db),
      setupCrossSectionCollections(db),
    ]);

    return ok(new this(db));
  }

  public async createUser(
    system: Database,
    username: string,
    password: string,
  ) {
    const users = await system.listUsers();

    if (users.map((user) => user.user).includes(username)) {
      throw Error(`User ${username} already exists.`);
    }

    const user = await system.createUser(username, password);

    await this.setupUserPrivileges(system, username);

    return user;
  }

  public async setupUserPrivileges(system: Database, username: string) {
    const collections = await this.db.listCollections();

    await system.setUserAccessLevel(username, {
      database: this.db.name,
      grant: "ro",
    });

    await Promise.all(collections.map((collection) =>
      system.setUserAccessLevel(
        username,
        {
          database: this.db.name,
          collection: collection.name,
          grant: "rw",
        },
      )
    ));
  }

  public async setupCollections() {
    await setupUserCollections(this.db);
    await setupSharedCollections(this.db);
    await setupCrossSectionCollections(this.db);
  }

  public static init(
    url: string,
    name = "lxcat",
    username = "root",
    password: string | undefined,
  ) {
    return new this(
      new Database({
        databaseName: name,
        url,
        auth: { username, password },
        // Better error with https://github.com/arangodb/arangojs#error-stack-traces-contain-no-useful-information
        precaptureStackTraces: process.env.NODE_ENV !== "production",
      }),
    );
  }

  public name() {
    return this.db.name;
  }

  public async truncateNonUserCollections() {
    const collections = await this.db.collections(true);
    for (const c of collections) {
      if (c.name !== "users" && c.name !== "Element") {
        console.log(`Truncating ${c.name}`);
        await c.truncate();
      }
    }
  }

  public async dropNonUserCollections() {
    const collections = await this.db.collections(true);
    for (const c of collections) {
      if (c.name !== "users") {
        console.log(`Dropping ${c.name}`);
        await c.drop();
      }
    }
  }

  // shared/queries
  protected insertDocument = insertDocument;
  protected upsertDocument = upsertDocument;
  protected insertEdge = insertEdge;

  public insertStateDict = insertStateDict;
  protected insertStateTree = insertStateTree;
  protected insertUnspecified = insertUnspecified;
  protected insertAtom = insertAtom;
  protected insertMolecule = insertMolecule;
  protected insertState = insertState;
  protected insertComposition = insertComposition;

  public insertReferenceDict = insertReferenceDict;

  public insertReactionWithDict = insertReactionWithDict;

  public upsertOrganization = upsertOrganization;
  public getOrganizationByName = getOrganizationByName;

  // references
  public getReferences = getReferences;
  public getReferencesForSelection = getReferencesForSelection;
  public getReferenceKeyByDOI = getReferenceKeyByDOI;

  // auth/queries
  public listUsers = listUsers;

  public getUserByKey = getUserByKey;
  public getUserByEmail = getUserByEmail;
  public getUserByAccount = getUserByAccount;

  public addUser = addUser;
  public updateUser = updateUser;
  public dropUser = dropUser;

  public linkAccount = linkAccount;
  public unlinkAccount = unlinkAccount;

  public addSession = addSession;
  public getSessionAndUser = getSessionAndUser;
  public updateSession = updateSession;
  public dropSession = dropSession;

  public listContributors = listContributors;

  public listOrganizations = listOrganizations;
  public addOrganization = addOrganization;
  public dropOrganization = dropOrganization;

  public getAffiliations = getAffiliations;
  public setAffiliations = setAffiliations;
  public stripAffiliations = stripAffiliations;

  public toggleRole = toggleRole;
  public makeAdmin = makeAdmin;

  // species
  public getTopLevelSpecies = getTopLevelSpecies;
  public getSpeciesChildren = getSpeciesChildren;

  // elements
  public getActiveElements = getActiveElements;
  public getSetHeaderByElements = getSetHeaderByElements;

  // reaction
  protected findReactionId = findReactionId;

  // author_write
  public updateSetVersionStatus = updateSetVersionStatus;
  public createSet = createSet;
  public updateSet = updateSet;
  public deleteSet = deleteSet;
  public publishSet = publishSet;
  protected createDraftSet = createDraftSet;
  protected isDraftlessSet = isDraftlessSet;
  public removeDraftSetUnchecked = removeDraftUnchecked;
  public retractSetUnchecked = retractSetUnchecked;
  protected draftItemsFromSet = draftItemsFromSet;
  protected doesPublishingEffectOtherSets = doesPublishingEffectOtherSets;
  protected updateDraftSet = updateDraftSet;

  // cs/author_read
  public searchOwnedItems = searchOwned;
  public getItemByOrgAndId = byOrgAndId;
  public getItemByOwnerAndId = itemByOwnerAndId;

  // cs/public
  public itemHistory = csHistory;
  public getItemHeadings = getCSHeadings;
  public getItemById = byId;

  // write
  public createItem = createCS;
  public updateItem = updateCS;
  public deleteItem = deleteCS;
  protected dropReferencesFromExcluding = dropReferencesFromExcluding;
  protected isPartOf = isPartOf;
  public getItemVersionInfo = getItemVersionInfo;
  protected updateItemVersionStatus = updateItemVersionStatus;
  protected createDraftItem = createDraftCS;
  protected updateDraftItem = updateDraftCS;
  protected isItemDraftless = isDraftless;
  public publishItem = publishItem;

  // css/author_read
  public listOwnedSets = listOwnedSets;
  public isOwnerOfSet = isOwnerOfSet;
  public getSetByOwnerAndId = byOwnerAndId;
  public getSetVersionInfo = getSetVersionInfo;

  // css/public
  public listSets = listSets;
  public getSetById = setById;
  public getMixtureByIds = byIds;
  public setHistory = setHistory;
  public getItemIdsInSet = getItemIdsInSet;
  public activeSetOfArchivedSet = activeSetOfArchivedSet;

  // css/get-affiliation
  public getSetAffiliation = getSetAffiliation;

  // css/get-num-items-in-set
  public getNumItemsInSet = getNumItemsInSet;

  // cs/picker
  public getSearchOptions = getSearchOptions;
  public getPartakingStateSelection = getPartakingStateSelection;
  public getStateSelection = getStateSelection;
  public getAvailableTypeTags = getAvailableTypeTags;
  public getReversible = getReversible;
  public getAvailableSets = getCSSets;
  public getItemIdsByReactionTemplate = getCSIdByReactionTemplate;
}
