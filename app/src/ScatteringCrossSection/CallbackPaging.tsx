import { PagingOptions } from "@lxcat/database/dist/shared/types/search";
import { Button } from "@mantine/core";

export const CallbackPaging = ({
  paging,
  nrOnPage,
  onOffsetChange,
}: {
  paging: PagingOptions;
  nrOnPage: number;
  onOffsetChange: (offset: number) => void | Promise<void>;
}) => (
  <div style={{ marginTop: "1rem" }}>
    {paging.offset > 0 && (
      <Button
        title="Previous page"
        onClick={async () => onOffsetChange(paging.offset - paging.count)}
      >
        &lt;&lt;
      </Button>
    )}
    <span>
      &nbsp;{paging.offset} - {paging.offset + nrOnPage}{" "}
    </span>
    {/* TODO improve check whether a next page exists
    currently if current page has max items then it is highly likely there is a next page */}
    {nrOnPage >= paging.count && (
      <Button
        title="Next page"
        onClick={async () => onOffsetChange(paging.offset + paging.count)}
      >
        &gt;&gt;
      </Button>
    )}
  </div>
);
