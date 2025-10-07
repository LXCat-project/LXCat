// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

"use client";

import { useState } from "react";

import { FormattedReference } from "@/citation/formatted-reference";
import { HowToCite } from "@/citation/how-to-cite";
import { TermsOfUse } from "@/citation/terms-of-use";
import { Button, Center, Modal } from "@mantine/core";
import { IconLicense } from "@tabler/icons-react";
import { TERMS_OF_USE_COOKIE_NAME } from "../../../shared/download";
import { ButtonClipboard } from "./button-clipboard";
import { acceptTermsOfUseAction } from "./terms-of-use-action";

interface Props {
  references: FormattedReference[];
  permaLink: string;
  forceOpen?: boolean;
}

export const TermsOfUseCheck = (
  { references, permaLink, forceOpen }: Props,
) => {
  const hasAcceptedTerms = typeof document !== "undefined"
    ? document.cookie.includes(TERMS_OF_USE_COOKIE_NAME)
    : false;
  const [agreement, setAgreement] = useState(!forceOpen && hasAcceptedTerms);

  async function acceptTermsOfUse() {
    try {
      await acceptTermsOfUseAction();
      setAgreement(true);
    } catch {
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
