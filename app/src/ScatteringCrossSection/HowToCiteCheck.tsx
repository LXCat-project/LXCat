import { ReactNode, useState } from 'react'
import { HowToCite } from './HowToCite'
import { Reference } from "./types"

interface Props {
    references: Reference[]
    children: ReactNode
}

export const HowToCiteCheck = ({references, children}: Props) => {
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
                <HowToCite references={references}/>
                <button onClick={() => setAgreement(true)}>
                    I agree with the terms of use
                </button>
            </div>
        )
    }
}