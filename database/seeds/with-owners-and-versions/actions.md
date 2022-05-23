# Actions

## Create new cross section set

* Insert incoming document into CrossSectionSetPrivate collection
* Look up organization, if not exists then raise error

## Update existing cross section set

* Insert incoming document into CrossSectionSetPrivate collection
* Set versionInfo.current in CrossSectionSetPrivate collection to the id of the set in the CrossSectionSet collection

## Publish new draft cross section set

* Move document from CrossSectionSetPrivate collection to CrossSectionSet collection
* Assign version 1 to document in CrossSectionSet collection
* Insert cs/references/reaction states into their respective collections,
  * If exact reference already exists then use that id in edge collection

## Publish updated draft cross section set

* Copy old CrossSectionSet collection to CrossSectionSetArchive collection
* Store commit message in CrossSectionSetArchive collection
* Move document from CrossSectionSetPrivate collection to CrossSectionSet collection.
* Updated document in CrossSectionSet collection should retain its id.
* Assign version +1 to updated document in CrossSectionSet collection
* Insert cs/references/reaction states into their respective collections,
  * If exact reference already exists then use that id in edge collection
* If a cs has been removed in draft
  * and if it was used in other set then ???
  * and if it was not used in other set then move cs to archve

## Retract cross section set

* Copy old CrossSectionSet collection to CrossSectionSetArchive collection
* Store commit message in CrossSectionSetArchive collection

## Update existing cross section

* Edit set in which cross section is part of

## Retract cross section

* Remove section from a set, by editing set
* A orphaned cross section (aka cross section not part of section), should be archived with restraction message
