import { useState } from "react";
import { Layout } from "../shared/Layout";

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
        <p>Some API endpoints require authentication.</p>
        <p> Use `Authorization: Bearer &lt;token&gt;` as header in request.</p>
        <button onClick={generateToken}>Generate token</button>
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
