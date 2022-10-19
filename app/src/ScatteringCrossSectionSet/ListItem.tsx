import Link from "next/link";
import { CrossSectionSetHeading } from "@lxcat/database/dist/css/public";

export const ListItem = (props: CrossSectionSetHeading) => {
  return (
    <div role="listitem">
      <Link href={`/scat-css/${props.id}`}>
        <a
          style={{
            boxShadow: "3px 5px 2px gray",
            padding: 4,
            border: "1px black solid",
          }}
        >
          {props.name}
        </a>
      </Link>
    </div>
  );
};
