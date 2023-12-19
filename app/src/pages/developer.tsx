// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Button, Space } from "@mantine/core";
import { useState } from "react";
import { Layout } from "../shared/layout";
import { TermsOfUseCheckForDeveloper } from "../shared/terms-of-use-developer";

const DeveloperPage = () => {
  const [token, setToken] = useState("");
  const [expires, setExpires] = useState("");
  async function generateToken() {
    const res = await fetch("/api/auth/apitoken");
    const body = await res.json();
    setToken(body.token);
    setExpires(body.expires);
  }
  return (
    <Layout>
      <div>
        <h2>API tokens</h2>
        <p>
          The API endpoints of the LXcat web service require authentication.
        </p>
        <p>
          Use `Authorization: Bearer &lt;token&gt;` as header in the HTTP
          request.
        </p>
        <TermsOfUseCheckForDeveloper />
        <Space h="md" />
        <Button onClick={generateToken}>
          I agree with terms of usage & generate token
        </Button>
        <Space h="md" />
        {token && (
          <div>
            <textarea rows={5} cols={120} readOnly value={token} />
            <div>Token expires on {expires}</div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DeveloperPage;
