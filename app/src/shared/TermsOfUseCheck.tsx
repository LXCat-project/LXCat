import { ReactNode, useState } from 'react'
import { HowToCite } from './HowToCite'
import { Reference } from './types/reference'

interface Props {
    references: Reference[]
    children: ReactNode
}

export const TermsOfUseCheck = ({references, children}: Props) => {
    // TODO remember that visitor agreed during current session

    const [agreement, setAgreement] = useState(false)
    if (agreement) {
        return (
            <>
                {children}
            </>
        )
    } else {
        return (
            <div>
                <h2>Terms of use</h2>
                <p>
                    Users acknowledge understanding that LXCat is a community-based project with open-access databases being freely provided by individual contributors.
                </p><p>
                    <b>Proper referencing of material retrieved from this site is essential for the survival of the project.</b>
                </p>
                <HowToCite references={references}/>
                <button onClick={() => setAgreement(true)}>
                    I agree with the terms of use
                </button>
            </div>
        )
    }
}