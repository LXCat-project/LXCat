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

export const Dialog = ({
  isOpened,
  onSubmit: onsubmit,
  children,
  className,
}: Props) => {
  const ref: any = useRef(null);
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
      onCancel={() => onsubmit("cancel")}
      onClose={(e) => onsubmit((e.target as any).returnValue)}
      className={className}
    >
      {children}
    </dialog>
  );
};
