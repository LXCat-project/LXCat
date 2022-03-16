import type { CrossSection } from './types'
import { HowToCite } from './HowToCite'

interface Props {
    section: CrossSection
}

export const Section = ({section}: Props) => {
    return (
        <div>
            <h1>Scattering Cross Section</h1>
            <div>Species: {section.species1} / {section.species2}</div>
            <div>Database: {section.database}</div>
            <div>Group: {section.group}</div>
            
            <div>
                Data: {section.data}
            </div>

            <HowToCite references={section.references}/>
        </div>
    )
}