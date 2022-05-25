# Actions

## Create new draft cross section

* Add to CrossSection with status=='draft' and version=='1'
* Insert into Organization, Reaction, State, Reference collection or reuse existing

## Update existing cross section by creating a draft

* Add to CrossSection with status=='draft'
* For draft version = prev version + 1
* Insert into Organization, Reaction, State, Reference collection or reuse existing
* Add previous version and current version to CrossSectionHistory collection

## Publish new draft cross section

* Change status of draft section to published

## Publish updated draft cross section

In transaction do:
1. Find sets with current published section
  * Update IsPartOf collection to draft section
  * Create new version of each set (see chapter below)
2. Change status of current published section to archived
3. Change status of draft section to published

## Retract cross section

* Change status of published section to retracted
* Set retract message
1. Find sets with current published section
  * give choice or
    * remove cross section from set and create new set version
    * or retract the set

## Create new draft cross section set

* Add to CrossSectionSet with status=='draft' and version=='1'
* Insert or reuse cross section using `#Create new draft cross section` chapter.
* Reuse Organization created by cross section drafting
* Make cross sections part of set by adding to IsPartOf collection

## Update existing cross section set by creating a draft

* Add to CrossSectionSet with status=='draft'
* For draft version = prev version + 1
* Insert or reuse cross section using `#Create new draft cross section` chapter.
* Make cross sections part of set by adding to IsPartOf collection
* Add previous version and current version to CrossSectionSetHistory collection

## Publish new draft cross section set

In transaction do:
1. Change status of draft section to published
2. For each changed/added cross section perform publishing of cross section

## Publish updated draft cross section set

In transaction do:
1. Change status of current published section to archived
2. Change status of draft section to published
3. For each changed/added cross section perform publishing of cross section

## Retract cross section set

* Change status of published section to retracted
* Set retract message
* Retract selected cross section