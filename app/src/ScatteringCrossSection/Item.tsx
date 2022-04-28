import { Reference } from "../shared/Reference"
import { ReactionSummary } from "./ReactionSummary"
import { CrossSectionItem } from "./types/public"

export const Item = (props: CrossSectionItem) => {
    return (
        <div>
            <h1>Scattering Cross Section</h1>
            <h2>Reaction</h2>
            <ReactionSummary {...props.reaction}/>
            {/* TODO show charge, non-simpleparticle data */}
            <h2>Part of set</h2>
            <div>
                <div>Name: {props.isPartOf.name}</div>
                <div>Description: {props.isPartOf.description}</div>
                <div>Complete: {props.isPartOf.complete ? 'Yes' : 'No'}</div>
            </div>
            <h2>Data</h2>
            <table>
                <thead>
                    <tr>
                        {props.labels.map((l, i) => <td key={l}>{l} ({props.units[i]})</td>)}
                    </tr>
                </thead>
                <tbody>
                    {props.data.map(
                        (r, i) => <tr key={i}>
                            {r.map(
                                (c,j) => <td key={j}>{c}</td>
                            )}
                        </tr>
                    )}
                </tbody>
            </table>
            <h2>Reference</h2>
            <ul>
                {props.reference.map((r, i) => <li key={i}><Reference {...r}/></li>)}
            </ul>
        </div>
    )
}