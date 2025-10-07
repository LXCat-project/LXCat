// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useState } from "react";

import { HowToCite } from "@/shared/how-to-cite";
import { Button, Center, Modal } from "@mantine/core";
import { IconLicense } from "@tabler/icons-react";
import { DOWNLOAD_COOKIE_NAME } from "../../../shared/download";
import { TermsOfUse } from "../../../shared/terms-of-use";
import { ButtonClipboard } from "./button-clipboard";
import { FormattedReference } from "./types";

interface Props {
  references: FormattedReference[];
  permaLink: string;
  forceOpen?: boolean;
}

export const TermsOfUseCheck = (
  { references, permaLink, forceOpen }: Props,
) => {
  const hasDownloadToken = typeof document !== "undefined"
    ? document.cookie.includes(DOWNLOAD_COOKIE_NAME)
    : false;
  const [agreement, setAgreement] = useState(!forceOpen && hasDownloadToken);

  async function acceptTermsOfUse() {
    const url = "/api/auth/tou";
    const res = await fetch(url, {
      method: "POST",
    });
    if (res.ok) {
      setAgreement(true);
    } else {
      // Give error feedback to user
    }
    if (forceOpen) {
      const searchParams = new URLSearchParams(document.location.search);
      searchParams.delete("termsOfUse");

      document.location.search = searchParams.toString();
    }
  }

  return (
    <>
      <Button
        type="button"
        size="md"
        rightSection={<IconLicense size={"1.05rem"} stroke={1.5} />}
        onClick={() => setAgreement(false)}
      >
        Terms of use
      </Button>
      <Modal
        opened={!agreement}
        withCloseButton={false}
        onSubmit={acceptTermsOfUse}
        onClose={() => {}}
        size="70%"
      >
        <h2>Terms of use</h2>
        <TermsOfUse />
        <HowToCite references={references} />
        <Center>
          <Button.Group style={{ marginTop: 10 }}>
            <ButtonClipboard link={permaLink}>Copy permalink</ButtonClipboard>
            <Button size="md" onClick={acceptTermsOfUse}>
              I agree with the terms of use
            </Button>
          </Button.Group>
        </Center>
      </Modal>
    </>
  );
};
