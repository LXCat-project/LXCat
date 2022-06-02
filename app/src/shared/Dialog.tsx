import { useEffect, useRef } from "react"

interface Props {
    isOpened: boolean,
    onSubmit: (returnValue: string) => void,
    children: React.ReactNode,
}

export const Dialog = ({isOpened, onSubmit: onsubmit, children}: Props) => {
    const ref: any = useRef(null)
    useEffect(() => {
        if (isOpened) {
          ref.current?.showModal();
        } else {
          ref.current?.close();
        }
      }, [isOpened]);
    return (
        <dialog
            ref={ref}
            onCancel={() => onsubmit('cancel')}
            onClose={(e) => onsubmit((e.target as any).returnValue)}
        >
            {children}
        </dialog>
    )
}