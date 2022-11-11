import Link from "next/link";
import { ReactionSummary } from "./ReactionSummary";
import { CrossSectionHeading } from "@lxcat/database/dist/cs/public";

const style = {
  boxShadow: "3px 5px 2px gray",
  padding: 4,
  border: "1px black solid",
};

export function ListItem(props: CrossSectionHeading) {
  let partOf = <></>;
  if (props.isPartOf.length === 1) {
    partOf = <div>Part of &quot;{props.isPartOf[0]}&quot; set</div>;
  } else if (props.isPartOf.length > 1) {
    const quotedNames = props.isPartOf.map((n) => `&quot;${n}&quot;`).join(", ");
    partOf = <div>Part of {quotedNames} sets</div>;
  }
  return (
    <Link href={`/scat-cs/${props.id}`}>
      <a style={style} role="listitem">
        <ReactionSummary {...props.reaction} />
        {partOf}
      </a>
    </Link>
  );
}
