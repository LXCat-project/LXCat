// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PagingOptions } from "@lxcat/database/dist/shared/types/search";
import Link from "next/link";
import { ParsedUrlQueryInput } from "querystring";

export const Paging = ({
  paging,
  nrOnPage,
  query,
  onChange,
}: {
  paging: PagingOptions;
  nrOnPage: number;
  query: ParsedUrlQueryInput;
  onChange?: (newPaging: PagingOptions) => void | Promise<void>;
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
        title="Previous page"
        onClick={() => {
          if (onChange) {
            return onChange({
              ...paging,
              offset: paging.offset - paging.count,
            });
          }
        }}
      >
        &lt;&lt;
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
        title="Next page"
        onClick={() => {
          if (onChange) {
            return onChange({
              ...paging,
              offset: paging.offset + paging.count,
            });
          }
        }}
      >
        &gt;&gt;
      </Link>
    )}
  </div>
);
