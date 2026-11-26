import { redirect } from "react-router";
import type { Route } from "./+types/prototype.notifications";
import {
  PrototypeNotificationPage,
  samples,
} from "~/components/notifications-prototype";
import { getCurrentUserId } from "~/lib/session";
import { sendKnockPrototypeSample } from "~/lib/knock-prototype.server";

export function loader({ params, request }: Route.LoaderArgs) {
  if (!import.meta.env.DEV) throw new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const variant = url.searchParams.get("variant");
  if (
    params.target
      ? variant !== "A" && variant !== "B" && variant !== "K"
      : variant !== "B"
  ) {
    url.searchParams.set("variant", "B");
    return redirect(url.pathname + url.search);
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  if (
    !import.meta.env.DEV ||
    new URL(request.url).searchParams.get("variant") !== "K"
  ) {
    throw new Response("Not found", { status: 404 });
  }
  const id = await getCurrentUserId(request);
  const sampleId = (await request.formData()).get("sample");
  const sample = samples.find(({ id }) => id === sampleId);
  if (!id || !sample) return { ok: false };

  try {
    await sendKnockPrototypeSample(id, sample);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export default function NotificationPrototypeRoute({
  params,
}: Route.ComponentProps) {
  return <PrototypeNotificationPage target={params.target} />;
}
