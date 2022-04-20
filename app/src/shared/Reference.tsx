import { Reference as ReferenceRecord } from "./types/reference"

export const Reference = (r: ReferenceRecord) => {
    const authors = r.author?.map((p) => `${p.given} ${p.family} ${p.suffix}`).join(', ')
    return (
        <dl>
            <dt>{r.title}</dt>
            <dd>{authors}, {r["container-title"]}</dd>
        </dl>
    )
}