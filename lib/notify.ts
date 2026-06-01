type PushPayload = {
  county: string;
  title: string;
  body: string;
  url: string;
};

export async function sendCountyPush({ county, title, body, url }: PushPayload) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    console.warn("OneSignal not configured — skipping push");
    return;
  }

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      filters: [{ field: "tag", key: "county", relation: "=", value: county }],
      headings: { en: title },
      contents: { en: body },
      url: `${process.env.NEXT_PUBLIC_APP_URL}${url}`,
      web_push_topic: county,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OneSignal error ${res.status}: ${text}`);
  }
}
