import Image from 'next/image'
import Link from 'next/link'
import { CSSProperties } from 'react'
import logo from '../../public/lxcat.png'

const navStyle: CSSProperties = {
    backgroundColor: '#254779',
    display: 'flex',
    color: '#d1d4da',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 24,
    minHeight: 60,
    gap: 10
}

export const NavBar = () => {
    return (
        <nav style={navStyle}>
            <Link href="/">
                <a>
                    <Image src={logo} alt="Logo of LXCat"/>
                </a>
            </Link>
            <div style={{flexGrow: 1, display: 'flex', flexDirection: 'row', gap: 10}}>
                <Link href="/data-center">
                    <a>Data center</a>
                </Link>
                <Link href="/team">
                    <a>Team</a>
                </Link>
            </div>
            <div>
                Login
            </div>
        </nav>
    )
}