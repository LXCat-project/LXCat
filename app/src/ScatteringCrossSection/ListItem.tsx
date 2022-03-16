import Link from "next/link";
import { CrossSectionHeading } from "./types";

export function ListItem(props: CrossSectionHeading) {
    return (
        <Link href={`/scat-cs/${props.id}`} passHref>
            <a style={{boxShadow: '3px 5px 2px gray', padding: 4, border: '1px black solid'}}>
                <div>{props.species1} / {props.species2}</div>
                <div>{props.database} database</div>
                <div>{props.group} data group</div>
                <div>{props.process}</div>
            </a>
        </Link>
    )
}