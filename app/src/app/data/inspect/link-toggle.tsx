// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Link, { LinkProps } from "next/link";

export const LinkToggle: React.FunctionComponent<
  & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>
  & LinkProps
  & {
    children?: React.ReactNode;
  }
  & React.RefAttributes<HTMLAnchorElement>
  & { disabled?: boolean }
> = (
  { disabled, children, ...props },
) => (disabled ? <>{children}</> : <Link {...props}>{children}</Link>);
