import { Reference } from "./Reference"
import { Reference as IReference } from "./types"

interface Props {
    references: IReference[]
}

export const HowToCite = ({references}: Props) => {
    return (
        <div>
            <h2>How to reference data</h2>
            <ul>
                <li>Reference to LXCat</li>
                {references.map((r) => <li key={r.title}><Reference {...r}/></li>)}
            </ul>
            ...
        </div>
    )
}