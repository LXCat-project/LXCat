import Link from "next/link"
import type { SearchOptions } from "./queries"

interface Props {
    facet: string[]
    selection: SearchOptions
    selectionKey: keyof SearchOptions
}

export const CheckBoxGroup = ({facet, selection, selectionKey}: Props) => {
    console.log(selection, selectionKey)
    const selectionValue = selection[selectionKey]
    return (
        <div>
            {facet.map(d => {
                const checked = selectionValue.some(s => s === d)
                const query = {
                    ...selection,
                    // If checked then remove item else add item
                    [selectionKey]: checked ? selectionValue.filter(s => s !== d) : [...selectionValue, d]
                }
                return (
                    <div key={d}>
                        <Link href={{
                            pathname: '/scat-cs',
                            query
                        }}>
                            <a>
                                <label>
                                    <input type="checkbox" readOnly checked={checked} />
                                    {d}
                                </label>
                            </a>
                        </Link>
                    </div>
                )
            })}
        </div>
    )
}