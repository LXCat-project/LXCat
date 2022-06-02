/**
 * Functions that interact with API endpoints
 */

const headers = new Headers({
  Accept: "application/json",
  "Content-Type": "application/json",
});

export async function deleteSet(key: string, message?: string) {
  const url = `/api/scat-css/${key}`;
  const body = JSON.stringify({ message: message });
  const init = { method: "DELETE", body, headers };
  const res = await fetch(url, init);
  const data = await res.json();
  return data;
}

export async function publishSet(selectedSetId: string) {
  const url = `/api/scat-css/${selectedSetId}/publish`;
  const init = { method: "POST", headers };
  const res = await fetch(url, init);
  const data = await res.json();
  return data;
}
