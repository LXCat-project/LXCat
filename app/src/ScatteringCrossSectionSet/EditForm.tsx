import { CrossSectionSetInputOwned } from "@lxcat/database/dist/css/queries/author_read";

interface Props {
    set: CrossSectionSetInputOwned;
    setKey: string;
    commitMessage: string;
    onSubmit: (newSet: CrossSectionSetInputOwned, newMessage: string) => void
}

export const EditForm = (_props: Props) => {
    return (
        <div>TODO Fancy edit form.</div>
    )
}