# Where the enquiries go

The form on the site POSTs JSON to one endpoint. That endpoint puts the
message into Telegram. **The bot token lives on the server and never reaches
the browser** — if you paste it into `index.html` anyone can read it and take
over the bot.

Pick ONE of the two options below.

---

## 1. Get a bot and a chat id (needed for either option)

1. In Telegram, message **@BotFather**, send `/newbot`, follow the prompts.
   It replies with a token that looks like `1234567890:AAH-xxxxxxxxxxxxxxxxx`.
   That is your `TELEGRAM_BOT_TOKEN`.

2. Decide where enquiries should land:
   - **A private chat with you** — message your new bot once (say "hi"), or
   - **A group** (better: several people see the leads) — create the group,
     add the bot to it, and send one message in the group.

3. Get the chat id. Open this in a browser, replacing `<TOKEN>`:

   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```

   Find `"chat":{"id":...}` in the response. That number is your
   `TELEGRAM_CHAT_ID`. Group ids are negative, e.g. `-1001234567890`. That is
   normal — keep the minus sign.

   If `getUpdates` is empty, send another message to the bot or the group and
   reload.

---

## 2a. Cloudflare Worker (free, recommended)

No server to maintain, works with any static host.

```bash
npm install -g wrangler
wrangler login
cd api
wrangler deploy
wrangler secret put TELEGRAM_BOT_TOKEN     # paste the token
wrangler secret put TELEGRAM_CHAT_ID       # paste the chat id
```

`wrangler deploy` prints a URL like
`https://ligarent-lead.<your-subdomain>.workers.dev`.

Put that URL into `index.html`:

```js
window.LIGARENT_CONFIG = {
  leadEndpoint : 'https://ligarent-lead.your-subdomain.workers.dev',
  ...
};
```

Then edit `api/wrangler.toml` and set `ALLOWED_ORIGIN` to your real domain so
nobody else can post through your endpoint.

---

## 2b. Plain PHP (any shared host with PHP)

1. Upload `api/telegram.php`, `api/config.example.php` and `api/.htaccess`.
2. Copy `config.example.php` to `config.php` and fill in the token and chat id.
3. Set `leadEndpoint` in `index.html` to `/api/telegram.php`.
4. Check `https://yoursite/api/config.php` returns 403 or a blank page, not the
   file contents. If your host is nginx rather than Apache, the `.htaccess` is
   ignored — move `config.php` above the web root and change the `require` path
   at the top of `telegram.php`.

---

## Testing it

Fill the form on the site and submit. Within a second or two a message should
appear in the chat, formatted like this:

```
🚜 NEW ENQUIRY — LIGARENT

👤 Name: Ivan
📞 Phone: +7 900 123 45 67
💬 WhatsApp: +7 900 765 43 21

🏗 Job:
Strip topsoil off 3 ha and form a pad. Probably a D6R.

⚖️ Size: About 20 t · tight sites, finish work · D6R
📍 Location: Kazan, Sovetsky district

lang ru · 2026-09-04T09:00:00.000Z
```

Both phone numbers are tappable — the WhatsApp one opens the chat directly.

To check the formatting without deploying anything:

```bash
node api/test-message.mjs
```

## If it does not arrive

- **Form shows "That did not send"** — the endpoint is unreachable or returned
  an error. Check `leadEndpoint` in `index.html` and open it directly in a
  browser; it should say `method not allowed`, not 404.
- **Endpoint returns 500 "not configured"** — the token or chat id is not set.
- **Endpoint returns 502 "delivery failed"** — Telegram rejected it. Usually a
  wrong chat id, or the bot was never messaged/added to the group.
- **Nothing at all and no error** — check the browser console for a CORS
  message, and set `ALLOWED_ORIGIN` (Worker) or `allowed_origin` (PHP) to your
  real domain.
