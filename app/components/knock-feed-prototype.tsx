import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import {
  KnockProvider,
  useKnockClient,
  useNotifications,
  useNotificationStore,
} from "@knocklabs/react";
import { useFetcher } from "react-router";
import { NotificationsPrototype, samples } from "./notifications-prototype";

type Credentials = {
  apiKey: string;
  feedId: string;
  userId: string;
  userToken: string;
};

type SidebarProps = ComponentProps<typeof NotificationsPrototype>["sidebar"];

export function KnockFeedPrototype({
  credentials,
  sidebar,
}: {
  credentials: Credentials | null;
  sidebar: SidebarProps;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !credentials) {
    const status = !sidebar.currentUser
      ? "Select a test account in DevUI."
      : !credentials
        ? "Knock development credentials are missing or invalid."
        : "Connecting to Knock…";
    return (
      <NotificationsPrototype
        sidebar={sidebar}
        variant="K"
        live={{ items: [], unread: 0, status, markRead: () => {} }}
      />
    );
  }

  return (
    <KnockProvider
      key={credentials.userId}
      apiKey={credentials.apiKey}
      user={{ id: credentials.userId }}
      userToken={credentials.userToken}
      identificationStrategy="skip"
    >
      <LiveFeed sidebar={sidebar} feedId={credentials.feedId} />
    </KnockProvider>
  );
}

function LiveFeed({
  sidebar,
  feedId,
}: {
  sidebar: SidebarProps;
  feedId: string;
}) {
  const knock = useKnockClient();
  const feed = useNotifications(knock, feedId);
  const { items, metadata, networkStatus } = useNotificationStore(feed);
  const [loaded, setLoaded] = useState(false);
  const [readError, setReadError] = useState(false);
  const send = useFetcher<{ ok: boolean }>();

  useEffect(() => {
    void feed.fetch().finally(() => setLoaded(true));
  }, [feed]);

  const rows = items.flatMap((item) => {
    const sample = samples.find(({ id }) => id === item.data?.sample);
    if (!sample || typeof item.data?.message !== "string") return [];
    return [
      {
        ...sample,
        id: item.id,
        target: sample.id,
        message: item.data.message,
        time: new Date(item.inserted_at).toLocaleString(),
        read: Boolean(item.read_at),
      },
    ];
  });

  async function markRead(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item || item.read_at) return;
    setReadError(false);
    try {
      if (!(await feed.markAsRead(item))) throw new Error("Read update failed");
    } catch {
      setReadError(true);
      await feed.fetch();
    }
  }

  return (
    <NotificationsPrototype
      sidebar={sidebar}
      variant="K"
      live={{
        items: rows,
        unread: metadata.unread_count,
        status:
          networkStatus === "error"
            ? "Could not load the Knock Feed."
            : !loaded
              ? "Connecting to Knock…"
              : undefined,
        markRead,
        controls: (
          <>
            <send.Form
              action="/prototype/notifications?variant=K"
              method="post"
              className="flex items-center gap-2"
            >
              <label className="sr-only" htmlFor="knock-sample">
                Test notification
              </label>
              <select
                className="min-h-8 rounded bg-zinc-800 px-2"
                id="knock-sample"
                name="sample"
              >
                {samples.map((sample) => (
                  <option key={sample.id} value={sample.id}>
                    {sample.detail}
                  </option>
                ))}
              </select>
              <button
                className="min-h-8 rounded px-2 hover:bg-zinc-700"
                disabled={send.state !== "idle"}
              >
                Send test
              </button>
            </send.Form>
            <button
              className="min-h-8 rounded px-2 hover:bg-zinc-700"
              type="button"
              onClick={() => void feed.fetch()}
            >
              Refresh Feed
            </button>
            <span role="status">
              {readError
                ? "Could not mark as read."
                : send.state !== "idle"
                  ? "Sending…"
                  : send.data?.ok
                    ? "Workflow triggered."
                    : send.data
                      ? "Workflow trigger failed."
                      : null}
            </span>
          </>
        ),
      }}
    />
  );
}
