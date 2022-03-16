import { Reference as IReference } from "./types"

export const Reference = (r: IReference) => {
    return (
        <dl>
            <dt>{r.title}</dt>
            <dd>{r.authors.join(', ')}, {r["container-title"]}</dd>
        </dl>
    )
}