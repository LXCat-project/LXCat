// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Database } from "arangojs";
import { CreateDatabaseOptions } from "arangojs/database";
import {
  addOrganization,
  dropOrganization,
  dropUser,
  getAffiliations,
  getUserByKey,
  listOrganizations,
  listUsers,
  makeAdmin,
  setAffiliations,
  stripAffiliations,
  toggleRole,
} from "./auth/queries";
import {
  getAvailableTypeTags,
  getCSIdByReactionTemplate,
  getCSSets,
  getPartakingStateSelection,
  getReversible,
  getSearchOptions,
  getStateSelection,
} from "./cs/picker/queries/public";
import {
  byOrgAndId,
  byOwnerAndId as itemByOwnerAndId,
  getVersionInfo as getItemVersionInfo,
  searchOwned,
} from "./cs/queries/author_read";
import {
  byId,
  byIds,
  csHistory,
  getCSHeadings,
  search,
} from "./cs/queries/public";
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
} from "./cs/queries/write";
import {
  byOwnerAndId,
  getVersionInfo as getSetVersionInfo,
  isOwnerOfSet,
  listOwnedSets,
} from "./css/queries/author_read";
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
} from "./css/queries/author_write";
import { getSetAffiliation } from "./css/queries/get-affiliation";
import {
  activeSetOfArchivedSet,
  byId as getSetByIdOld,
  byIdJSON,
  getItemIdsInSet,
  search as searchSet,
  searchContributors,
  searchFacets,
  setHistory,
  stateChoices,
  tagChoices,
} from "./css/queries/public";
import { setupUserCollections } from "./setup/2_users";
import { setupSharedCollections } from "./setup/3_shared";
import { setupCrossSectionCollections } from "./setup/4_cs";
import {
  insertDocument,
  insertEdge,
  insertReactionWithDict,
  insertReferenceDict,
  insertState,
  insertStateDict,
  insertStateTree,
  upsertDocument,
} from "./shared/queries";
import { upsertOrganization } from "./shared/queries/organization";
import { findReactionId } from "./shared/queries/reaction";
import {
  getReferences,
  getReferencesForSelection,
} from "./shared/queries/reference";
import {
  getSpeciesChildren,
  getTopLevelSpecies,
} from "./shared/queries/species";

export class LXCatDatabase {
  protected db: Database;

  protected constructor(db: Database) {
    this.db = db;
  }

  public static async create(
    system: Database,
    name: string,
    options?: CreateDatabaseOptions,
  ) {
    const db = await system.createDatabase(name, options);

    await setupUserCollections(db);
    await setupSharedCollections(db);
    await setupCrossSectionCollections(db);

    return new this(db);
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
      console.log(`Dropping ${c.name}`);
      if (c.name !== "users") {
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
  protected insertState = insertState;

  public insertReferenceDict = insertReferenceDict;

  public insertReactionWithDict = insertReactionWithDict;

  public upsertOrganization = upsertOrganization;

  // references
  public getReferences = getReferences;
  public getReferencesForSelection = getReferencesForSelection;

  // auth/queries
  public listUsers = listUsers;
  public getUserByKey = getUserByKey;
  public dropUser = dropUser;

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
  protected removeDraftSetUnchecked = removeDraftUnchecked;
  protected retractSetUnchecked = retractSetUnchecked;
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
  public searchItem = search;

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
  public getSetById = byIdJSON;
  public getSetByIdOld = getSetByIdOld;
  public searchSet = searchSet;
  public getMixtureByIds = byIds;
  public setHistory = setHistory;
  public getItemIdsInSet = getItemIdsInSet;
  public activeSetOfArchivedSet = activeSetOfArchivedSet;

  // css/get-affiliation
  public getSetAffiliation = getSetAffiliation;

  // css/picker
  public searchFacets = searchFacets;
  protected searchContributors = searchContributors;
  public stateChoices = stateChoices;
  protected tagChoices = tagChoices;

  // cs/picker
  public getSearchOptions = getSearchOptions;
  public getPartakingStateSelection = getPartakingStateSelection;
  public getStateSelection = getStateSelection;
  public getAvailableTypeTags = getAvailableTypeTags;
  public getReversible = getReversible;
  public getAvailableSets = getCSSets;
  public getItemIdsByReactionTemplate = getCSIdByReactionTemplate;
}
