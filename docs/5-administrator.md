<!--
SPDX-FileCopyrightText: LXCat team

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# Administrator docs

This document is for LXCat administrators.

- [Administrator docs](#administrator-docs)
  - [How to assign roles to users?](#how-to-assign-roles-to-users)
  - [How to let new user edit an existing data set?](#how-to-let-new-user-edit-an-existing-data-set)

## How to assign roles to users?

By default, a logged in user has the same permissions as an anonymous user.

To give a logged in user additional permissions, you need to assign roles to them on the
[/admin/users](/admin/users) page.

Available roles:

- **admin**, Can perform user and organization administration such as organization
  membership and role assignment.
- **author**, Can add a new data set and can edit an existing dataset if the user and
  dataset are member of the same organization.
- **developer**, Can use API endpoints as described in the [developer](developer)
  documentation.

## How to let a new user edit an existing data set?

Each dataset is owned by an organization. An organization has users as members.

To give a new user edit permission on an existing dataset you need to:

1. Find out which organization the dataset belongs to by looking at the dataset detail web
   page.
2. Add the user to the organization by
   1. Going to the [/admin/users](/admin/users) page
   2. Find the user in the user list
   3. In the organization multi-select, select the organization you want to assign the
      user to.
