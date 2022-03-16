import { Reference } from "./Reference"
import { Reference as IReference } from "./types"

interface Props {
    references: IReference[]
}

export const HowToCite = ({references}: Props) => {
    return (
        <div>
            <h1>How to cite</h1>
            <blockquote>
                <h2>Terms of use</h2>
                ...
            </blockquote>
            <h2>How to reference data</h2>
            <p>Reference to LXCat</p>
            <ul>
                {references.map((r) => <li key={r.title}><Reference {...r}/></li>)}
            </ul>
            ...
            ba
        </div>
    )
}