# Cadence Knock Feed prototype

Use the selected Cadence navigation bell to judge whether a real hosted Feed meets the Web V1 requirements. This branch uses synthetic fixtures and an isolated Knock development environment.

## Start

Run `npm ci` and `npm run db:seed` once in a fresh prototype checkout. Run `npm run prototype:knock`, then open <http://127.0.0.1:5176/courses?variant=K>. Pick a seeded account in DevUI. The original in-memory preview is available at <http://127.0.0.1:5176/courses?variant=A>.

## Connect a Knock development environment

1. Enable Knock environments if needed and use development. Enable Enhanced Security there to exercise signed tokens.
2. Create or reuse a development in-app Feed channel dedicated to this trial. Create and commit a development workflow with one in-app step targeting it. Set the step’s message body to `{{ data.message }}`. The trigger also sends `data.sample`, which the browser uses to select a local mock destination.
3. Add the following names to the ignored `.env` in this worktree and restart the app. Use the development credentials and a fresh namespace for each independent seeded database.

```dotenv
KNOCK_PUBLIC_API_KEY=
KNOCK_API_KEY=
KNOCK_SIGNING_KEY=
KNOCK_FEED_CHANNEL_ID=
KNOCK_PROTOTYPE_WORKFLOW=
KNOCK_PROTOTYPE_NAMESPACE=
```

The signing key can be copied in Knock’s base64 format. Use a unique namespace containing only letters, numbers, and hyphens. Cadence sends fixture text plus a namespaced test recipient ID to Knock. The button labeled **Send test** invokes the workflow only for the selected test account.

## Review in two browser sessions

- Send a test notification and record whether it appears without **Refresh Feed**. Open and close the list and verify the unread badge stays the same.
- Mark a notification read and verify the count drops by one. Send another sample and follow its link to a simulated business record. Go back and check the reopened list and keyboard focus.
- Reload and check that the read state persists. Open a second browser profile with the same test account. Record whether the change appears immediately or after **Refresh Feed**.
- Switch to another seeded account and verify that the first account’s notifications disappear. Trigger a different sample for the second account and repeat the check in both profiles.

Record the results on [用真实 Knock Feed 走查 Cadence 通知原型](https://github.com/eddielau0/cohort-005-project-fork-1/issues/7).
