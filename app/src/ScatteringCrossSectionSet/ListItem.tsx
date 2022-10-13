import Link from "next/link";
import { CrossSectionSetHeading } from "@lxcat/database/dist/css/public";

const style = {
  boxShadow: "3px 5px 2px gray",
  padding: 4,
  border: "1px black solid",
};

export const ListItem = (props: CrossSectionSetHeading) => {
  return (
    <Link href={`/scat-css/${props.id}`}>
      <a style={style} role="listitem">
        {props.name}
      </a>
    </Link>
  );
};
