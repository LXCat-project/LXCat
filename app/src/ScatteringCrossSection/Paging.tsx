import { PagingOptions } from "@lxcat/database/dist/shared/types/search";
import Link from "next/link";

export const Paging = ({
  paging,
  nrOnPage,
  query,
}: {
  paging: PagingOptions;
  nrOnPage: number;
  query: any;
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
      >
        <a title="Previous page">&lt;&lt;</a>
      </Link>
    )}
    <span>
      &nbsp;{paging.offset} - {paging.offset + nrOnPage}{" "}
    </span>
    {nrOnPage >= paging.count && (
      <Link
        href={{
          query: {
            ...query,
            offset: paging.offset + paging.count,
          },
        }}
      >
        <a title="Next page">&gt;&gt;</a>
      </Link>
    )}
  </div>
);
