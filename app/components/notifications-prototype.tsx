// Throwaway comparison in Cadence's app shell:
// /courses?variant=A (navigation bell), /courses?variant=B (dedicated notifications page).
import { useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Ticket,
  X,
  XCircle,
} from "lucide-react";
import { Popover } from "radix-ui";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useNavigationType,
  useOutletContext,
  useSearchParams,
} from "react-router";
import { Sidebar } from "~/components/sidebar";
import { cn } from "~/lib/utils";

const inboxPath = "/prototype/notifications";
const samples = [
  {
    id: "question",
    message: "Your question in “Working with Branches” was answered.",
    section: "Questions & Discussion",
    page: "Working with Branches",
    record: "Your question",
    detail: "Answered",
    time: "5 min ago",
    icon: MessageSquare,
  },
  {
    id: "approved",
    message: "Your refund request for “Git Fundamentals” was approved.",
    section: "Refund Requests",
    page: "Settings",
    record: "Git Fundamentals",
    detail: "Approved",
    time: "2 hours ago",
    icon: CheckCircle2,
  },
  {
    id: "seat",
    message:
      "The first seat for your “TypeScript Essentials” team licence was claimed.",
    section: "Team Licences",
    page: "Team",
    record: "TypeScript Essentials",
    detail: "First seat claimed",
    time: "Yesterday",
    icon: Ticket,
  },
  {
    id: "declined",
    message: "Your refund request for “React Essentials” was declined.",
    section: "Refund Requests",
    page: "Settings",
    record: "React Essentials",
    detail: "Declined",
    time: "2 days ago",
    icon: XCircle,
  },
];

type Variant = "A" | "B";

export function NotificationsPrototype({
  sidebar,
  variant,
}: {
  sidebar: ComponentProps<typeof Sidebar>;
  variant: Variant;
}) {
  const [readIds, setReadIds] = useState(["declined"]);
  const [empty, setEmpty] = useState(false);
  const [lastOpened, setLastOpened] = useState<string | null>(null);
  const [search, setSearch] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const returnedRow = navigationType === "POP" ? lastOpened : null;
  const open = variant === "A" && search.get("panel") === "open";
  const visible = empty ? [] : samples;
  const unread = visible.filter(({ id }) => !readIds.includes(id)).length;
  const countLabel = `${unread} unread`;
  const badge = unread > 0 && (
    <span
      aria-hidden="true"
      className="ml-auto rounded-full bg-foreground px-1.5 text-xs leading-4 text-background"
    >
      {unread}
    </span>
  );

  function markRead(id: string) {
    setReadIds((current) =>
      current.includes(id) ? current : [...current, id]
    );
  }

  function switchVariant() {
    setLastOpened(null);
    void navigate(`/courses?variant=${variant === "A" ? "B" : "A"}`, {
      replace: true,
    });
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.repeat ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            "input, textarea, select, [contenteditable], [role='dialog']"
          ))
      ) {
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        switchVariant();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [variant, navigate]);

  const list =
    visible.length === 0 ? (
      <div className="flex flex-col items-center gap-2 p-8 text-center">
        <Bell aria-hidden="true" className="size-5 text-muted-foreground" />
        <p className="text-sm font-medium">No notifications yet</p>
      </div>
    ) : (
      <ul className="divide-y">
        {visible.map(({ id, message, time, icon: Icon }) => {
          const read = readIds.includes(id);
          return (
            <li
              key={id}
              className={cn("flex items-start", !read && "bg-muted/65")}
            >
              <Link
                id={`notification-${id}`}
                to={`${inboxPath}/${id}?variant=${variant}#record-${id}`}
                state={{ fromNotifications: true }}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  markRead(id);
                  setLastOpened(id);
                }}
                className="flex min-w-0 flex-1 items-start gap-3 rounded-md py-3 pr-2 pl-4 outline-offset-[-2px] hover:bg-muted focus-visible:outline-2"
              >
                <span className="rounded-md border bg-background p-1.5">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span
                    className={cn(
                      "block text-sm leading-snug",
                      read ? "text-muted-foreground" : "font-semibold"
                    )}
                  >
                    {message}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span>{time}</span>
                    {!read && (
                      <span className="font-medium text-foreground">
                        Unread
                      </span>
                    )}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-muted-foreground"
                />
              </Link>
              <button
                type="button"
                aria-label={`${read ? "Already read" : "Mark as read"}: ${message}`}
                title={read ? "Already read" : "Mark as read"}
                aria-disabled={read}
                onClick={() => {
                  if (!read) markRead(id);
                }}
                className={cn(
                  "mr-2 mt-2 flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground focus-visible:outline-2",
                  !read &&
                    "cursor-pointer hover:bg-accent hover:text-foreground"
                )}
              >
                <Check aria-hidden="true" className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
    );

  return (
    <div className="flex h-dvh overflow-hidden max-sm:flex-col">
      <Sidebar
        {...sidebar}
        notificationPrototype={
          variant === "A"
            ? {
                bell: (
                  <Popover.Root
                    open={open}
                    onOpenChange={(nextOpen) => {
                      const nextSearch = new URLSearchParams(search);
                      if (nextOpen) nextSearch.set("panel", "open");
                      else nextSearch.delete("panel");
                      setSearch(nextSearch, {
                        replace: true,
                        preventScrollReset: true,
                      });
                    }}
                  >
                    <Popover.Trigger
                      className="relative grid size-10 cursor-pointer place-items-center rounded-md hover:bg-sidebar-accent focus-visible:outline-2"
                      aria-label={`Notifications, ${countLabel}`}
                    >
                      <Bell aria-hidden="true" className="size-5" />
                      {unread > 0 && (
                        <span
                          aria-hidden="true"
                          className="absolute right-0 top-0 rounded-full bg-foreground px-1.5 text-xs leading-4 text-background"
                        >
                          {unread}
                        </span>
                      )}
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content
                        aria-labelledby="notification-popup-heading"
                        align="start"
                        sideOffset={8}
                        collisionPadding={12}
                        onOpenAutoFocus={(event) => {
                          const row =
                            returnedRow &&
                            document.getElementById(
                              `notification-${returnedRow}`
                            );
                          if (row) {
                            event.preventDefault();
                            row.focus();
                          }
                        }}
                        className="z-30 w-[min(26rem,calc(100vw-1.5rem))] max-h-[min(var(--radix-popover-content-available-height),calc(100dvh-9rem))] overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-lg"
                      >
                        <div className="sticky top-0 flex items-start justify-between gap-4 border-b bg-popover px-4 py-3">
                          <div>
                            <h2
                              id="notification-popup-heading"
                              className="font-semibold"
                            >
                              Notifications
                            </h2>
                            <p className="text-xs text-muted-foreground">
                              {countLabel}
                            </p>
                          </div>
                          <Popover.Close
                            aria-label="Close notifications"
                            className="grid size-8 cursor-pointer place-items-center rounded-md hover:bg-accent focus-visible:outline-2"
                          >
                            <X aria-hidden="true" className="size-4" />
                          </Popover.Close>
                        </div>
                        {list}
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                ),
              }
            : {
                pageLink: (
                  <NavLink
                    to={`${inboxPath}?variant=B`}
                    end
                    aria-label={`Notifications, ${countLabel}`}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2",
                        isActive
                          ? "bg-sidebar-accent"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
                      )
                    }
                  >
                    <Bell aria-hidden="true" className="size-4" /> Notifications{" "}
                    {badge}
                  </NavLink>
                ),
              }
        }
      />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-24">
        <Outlet context={{ list, countLabel, returnedRow }} />
      </main>
      <span role="status" className="sr-only">
        {countLabel}
      </span>
      <div
        aria-label="Prototype controls"
        role="group"
        className="fixed inset-x-2 bottom-3 z-20 mx-auto flex w-fit max-w-[calc(100vw-1rem)] flex-wrap items-center justify-center gap-1 rounded-xl border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg"
      >
        <span className="px-1 text-zinc-300">Prototype</span>
        <button
          type="button"
          onClick={switchVariant}
          aria-label="Previous variation"
          className="grid size-8 cursor-pointer place-items-center rounded-md hover:bg-zinc-700 focus-visible:outline-2"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
        </button>
        <span className="min-w-20 text-center font-semibold">
          {variant === "A" ? "A · Bell" : "B · Page"}
        </span>
        <button
          type="button"
          onClick={switchVariant}
          aria-label="Next variation"
          className="grid size-8 cursor-pointer place-items-center rounded-md hover:bg-zinc-700 focus-visible:outline-2"
        >
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          aria-pressed={empty}
          onClick={() => setEmpty(!empty)}
          className="min-h-8 cursor-pointer rounded-md px-2 hover:bg-zinc-700 aria-pressed:bg-zinc-700 focus-visible:outline-2"
        >
          Empty
        </button>
        <button
          type="button"
          onClick={() => {
            setEmpty(false);
            setReadIds(["declined"]);
            setLastOpened(null);
          }}
          className="min-h-8 cursor-pointer rounded-md px-2 hover:bg-zinc-700 focus-visible:outline-2"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export function PrototypeNotificationPage({ target }: { target?: string }) {
  const { list, countLabel, returnedRow } = useOutletContext<{
    list: React.ReactNode;
    countLabel: string;
    returnedRow: string | null;
  }>();
  const focusedRecord = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const { search, state } = useLocation();
  const variant = new URLSearchParams(search).get("variant");
  const navigate = useNavigate();
  const record = samples.find(({ id }) => id === target);

  useEffect(() => {
    if (target) {
      (focusedRecord.current ?? heading.current)?.focus();
    } else {
      const row = returnedRow
        ? document.getElementById(`notification-${returnedRow}`)
        : null;
      (row ?? heading.current)?.focus();
    }
  }, [target, returnedRow]);

  if (!target) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
        <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{countLabel}</p>
        <div className="mt-6 overflow-hidden rounded-xl border bg-card">
          {list}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <Link
        to={
          variant === "A"
            ? "/courses?variant=A&panel=open"
            : `${inboxPath}?variant=B`
        }
        onClick={(event) => {
          if (
            state?.fromNotifications &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey
          ) {
            event.preventDefault();
            void navigate(-1);
          }
        }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Back to
        notifications
      </Link>
      <h1 ref={heading} tabIndex={-1} className="mt-5 text-3xl font-bold">
        {record?.page ?? "Content is no longer available"}
      </h1>
      {record && (
        <>
          <h2 className="mb-3 mt-8 text-lg font-semibold">{record.section}</h2>
          <article
            id={`record-${record.id}`}
            ref={focusedRecord}
            tabIndex={-1}
            aria-labelledby={`record-title-${record.id}`}
            className="rounded-xl border bg-card p-5 outline-offset-2 focus:outline-2"
          >
            <h3 id={`record-title-${record.id}`} className="font-medium">
              {record.record}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {record.detail}
            </p>
          </article>
        </>
      )}
    </section>
  );
}
