<!--
SPDX-FileCopyrightText: LXCat developer team

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Administrator docs

This document is for LXCat administrators.

## Table of contents

## How to assign roles to users?

A logged in user has the same permissions as an anonymous user.

To give a a logged in user more permssions, you need to assign roles to them on the [/admin/users](/admin/users) page.

Available roles:

* **admin**, Can perform user and organization administration like organization membership and role assignment.
* **author**, Can add a new data set and can edit an existing dataset if the user and dataset are member of same organization.
* **developer**, Can use API endpoints as described in [developer](developer) documentation.

## How to let new user edit an existing data set?

Each data set is owned by an organization. An organization has users as members.

To give a new user edit permission on an existing data set you need to

1. Find out which organization the data set belongs to by looking at the data set detail web page.
2. Add user to the organization by 
   1. Going to the [/admin/users](/admin/users) page
   2. Find the user in the user list
   3. In the organization multi select, select the organization you want to the user to be a member of.
