// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useRef } from "react";

interface Props {
  isOpened: boolean;
  onSubmit: (returnValue: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Dialog = ({ isOpened, onSubmit, children, className }: Props) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const current = ref.current;

    if (isOpened) {
      current?.showModal();
      return () => current?.close();
    } else {
      current?.close();
    }
  }, [isOpened]);
  return (
    <dialog
      ref={ref}
      onCancel={() => onSubmit("cancel")}
      onClose={(e) => onSubmit(e.currentTarget.returnValue)}
      className={className}
    >
      {children}
    </dialog>
  );
};
