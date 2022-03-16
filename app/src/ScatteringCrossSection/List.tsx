import { CrossSectionHeading } from "./types"
import { ListItem } from "./ListItem"

interface Props {
    items: CrossSectionHeading[]
}

export function List({ items }: Props) {
    return (
        <div style={{display: 'flex', gap: '1em', flexWrap: 'wrap' }}>
            {items.map(d => <ListItem key={d.id} {...d} />)}
        </div>
    )
}