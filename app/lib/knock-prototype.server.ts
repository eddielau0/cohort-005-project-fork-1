import Knock, { signUserToken } from "@knocklabs/node";

// Throwaway integration for an isolated Knock development environment.
function getConfig() {
  if (!import.meta.env.DEV) return null;
  const {
    KNOCK_PUBLIC_API_KEY: apiKey,
    KNOCK_API_KEY: secretKey,
    KNOCK_SIGNING_KEY: signingKey,
    KNOCK_FEED_CHANNEL_ID: feedId,
    KNOCK_PROTOTYPE_WORKFLOW: workflow,
    KNOCK_PROTOTYPE_NAMESPACE: namespace,
  } = process.env;
  if (
    !apiKey ||
    !secretKey ||
    !signingKey ||
    !feedId ||
    !workflow ||
    !namespace
  ) {
    return null;
  }
  return { apiKey, secretKey, signingKey, feedId, workflow, namespace };
}

export async function getKnockPrototypeUser(id: number) {
  const config = getConfig();
  if (!config) return null;
  const userId = `cadence-prototype-${config.namespace}-${id}`;
  const grants: Record<"user/feed_read" | "user/feed_write", []> = {
    "user/feed_read": [],
    "user/feed_write": [],
  };
  const userToken = await signUserToken(userId, {
    signingKey: config.signingKey,
    grants: [
      {
        entity: `https://api.knock.app/v1/users/${userId}`,
        grants,
      },
    ],
  });
  return { apiKey: config.apiKey, feedId: config.feedId, userId, userToken };
}

export async function sendKnockPrototypeSample(
  id: number,
  sample: { id: string; message: string }
) {
  const config = getConfig();
  if (!config) throw new Error("Knock prototype is not configured");
  const knock = new Knock({ apiKey: config.secretKey });
  await knock.workflows.trigger(config.workflow, {
    recipients: [{ id: `cadence-prototype-${config.namespace}-${id}` }],
    data: { sample: sample.id, message: sample.message },
  });
}
