import { ListItem } from "./ListItem";
import { CrossSectionHeading } from "./types/public";

interface Props {
  items: CrossSectionHeading[];
}

export function List({ items }: Props) {
  return (
    <div style={{ display: "flex", gap: "1em", flexWrap: "wrap" }}>
      {items.map((d) => (
        <ListItem key={d.id} {...d} />
      ))}
    </div>
  );
}
