import Link from "next/link"
import { Facets } from "./queries"

interface Props {
    facets: Facets
}

export const Filter = ({facets}: Props) => {
    return (
        <div style={{ display: 'flex' }}>
            <fieldset>
                <legend>Primary consumed particle</legend>
                <ul>
                    {facets.lhs_primary_particle.map(d => (
                        <li key={d}>
                            <Link href={{
                                pathname: '/scat-cs',
                                query: {
                                    lhs_primary_particle: d
                                }
                            }}>
                                <a>{d}</a>
                            </Link>
                        </li>
                    ))}
                </ul>
            </fieldset>
            <fieldset>
                <legend>Primary produced particle</legend>
                <ul>
                    {facets.rhs_primary_particle.map(d => (
                        <li key={d}>
                            <Link href={{
                                pathname: '/scat-cs',
                                query: {
                                    rhs_primary_particle: d
                                }
                            }}>
                                <a>{d}</a>
                            </Link>
                        </li>
                    ))}
                </ul>
            </fieldset>
            <fieldset>
                <legend>Set</legend>
                <ul>
                    {facets.set_name.map(d => (
                        <li key={d}>
                            <Link href={{
                                pathname: '/scat-cs',
                                query: {
                                    set_name: d
                                }
                            }}>
                                <a>{d}</a>
                            </Link>
                        </li>
                    ))}
                </ul>
            </fieldset>
        </div>
    )
}