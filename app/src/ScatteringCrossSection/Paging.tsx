// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PagingOptions } from "@lxcat/database/dist/shared/types/search";
import Link from "next/link";
import { ParsedUrlQuery } from "querystring";

export const Paging = ({
  paging,
  nrOnPage,
  query,
  onChange,
}: {
  paging: PagingOptions;
  nrOnPage: number;
  query: ParsedUrlQuery;
  onChange: (newPaging: PagingOptions) => void | Promise<void>;
}) => (
  <div style={{ marginTop: "1rem" }}>
    {paging.offset > 0 && (
      <Link
        href={{
          query: {
            ...query,
            offset: paging.offset - paging.count,
          },
        }}
        shallow={true}
      >
        <a
          title="Previous page"
          onClick={() =>
            onChange({ ...paging, offset: paging.offset - paging.count })
          }
        >
          &lt;&lt;
        </a>
      </Link>
    )}
    <span>
      &nbsp;{paging.offset} - {paging.offset + nrOnPage}{" "}
    </span>
    {/* TODO improve check whether a next page exists
    currently if current page has max items then it is highly likely there is a next page */}
    {nrOnPage >= paging.count && (
      <Link
        href={{
          query: {
            ...query,
            offset: paging.offset + paging.count,
          },
        }}
        shallow={true}
      >
        <a
          title="Next page"
          onClick={() =>
            onChange({ ...paging, offset: paging.offset + paging.count })
          }
        >
          &gt;&gt;
        </a>
      </Link>
    )}
  </div>
);
