import { redirect } from "react-router";
import type { Route } from "./+types/prototype.notifications";
import { PrototypeNotificationPage } from "~/components/notifications-prototype";

export function loader({ params, request }: Route.LoaderArgs) {
  if (!import.meta.env.DEV) throw new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const variant = url.searchParams.get("variant");
  if (params.target ? variant !== "A" && variant !== "B" : variant !== "B") {
    url.searchParams.set("variant", "B");
    return redirect(url.pathname + url.search);
  }
  return null;
}

export default function NotificationPrototypeRoute({
  params,
}: Route.ComponentProps) {
  return <PrototypeNotificationPage target={params.target} />;
}
