// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  IconApi,
  IconBook,
  IconFlask,
  IconTable,
  type TablerIcon,
} from "@tabler/icons-react";

export interface NavItem {
  label: string;
  description: string;
  href: string;
  icon: TablerIcon;
}

export interface NavGroup {
  /** Optional heading shown above the items of the group. */
  label?: string;
  items: Array<NavItem>;
}

export type NavLink =
  & {
    label: string;
    /** The link is active when the current path starts with any of these. */
    activePrefixes: Array<string>;
  }
  & (
    | {
      /** Destination of a plain link. */
      href: string;
    }
    | {
      /** Menu contents of a link that groups several destinations. */
      groups: Array<NavGroup>;
    }
  );

export const navLinks: Array<NavLink> = [
  {
    label: "Data center",
    activePrefixes: ["/scat-cs", "/scat-css", "/cs-set"],
    groups: [
      {
        label: "Rate Coefficients",
        items: [
          {
            label: "Reaction builder",
            description: "Search cross sections by reaction",
            href: "/scat-cs",
            icon: IconFlask,
          },
        ],
      },
      {
        label: "Chemistry sets",
        items: [
          {
            label: "Periodic table",
            description: "Browse sets by element",
            href: "/cs-set",
            icon: IconTable,
          },
        ],
      },
    ],
  },
  {
    label: "Team",
    href: "/team",
    activePrefixes: ["/team"],
  },
  {
    label: "Documentation",
    activePrefixes: ["/docs", "/api-doc"],
    groups: [
      {
        items: [
          {
            label: "General",
            description: "Guides for visitors, contributors and developers",
            href: "/docs/0-index",
            icon: IconBook,
          },
          {
            label: "API",
            description: "REST API reference",
            href: "/api-doc",
            icon: IconApi,
          },
        ],
      },
    ],
  },
];

export const isLinkActive = (link: NavLink, pathname: string) =>
  link.activePrefixes.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
