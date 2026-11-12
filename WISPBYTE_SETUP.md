# VMF Discord bot — Wispbyte setup

The website ZIP contains the Next.js website and API. It does **not** contain
`vmf_web.py` or the bot's main entry point, so the bot token variable name,
Python dependencies, and startup command must be checked against the actual bot
source before changing them.

## Confirmed variables used by the website's bot bridge

Set these in Wispbyte → your server → Startup → Environment Variables:

| Name | Value |
|---|---|
| `VMF_API_URL` | `https://vmf-drab.vercel.app` |
| `ADMIN_API_KEY` | The exact same secret value configured as `ADMIN_API_KEY` in Vercel |

`ADMIN_API_KEY` is used by the Discord-to-Roblox verification endpoints and
bot management endpoints. Keep it private. Do not paste it into Discord or
commit it to GitHub.

## Bot token — verify the name in the bot source

The supplied website project does not reveal whether the Wispbyte bot reads
`DISCORD_TOKEN`, `DISCORD_BOT_TOKEN`, `BOT_TOKEN`, `TOKEN`, or another name.
Do not add several guessed token variables. Open the bot's Python/JavaScript
source and find the environment lookup (for example `os.getenv("...")` or
`process.env....`); configure that exact name with the bot token in Wispbyte.

## Startup and dependencies

These also depend on the bot source:

- Python bot: select a Python runtime, install packages listed in its
  `requirements.txt`, and set Startup command to the actual entry file (for
  example `python vmf_web.py` only if that file contains the bot startup).
- Node bot: select Node.js, install dependencies from `package.json`, and use
  its configured start script or actual entry file.

Wispbyte's current setup instructions place environment variables, packages,
and startup command under the server's **Startup** settings. See:
https://wispbyte.com/kb/getting-started
https://wispbyte.com/kb/server-management

## Important

The README in this website project refers to `vmf_web.py`, but that file is
not present in this ZIP. Uploading this website ZIP to Wispbyte will not install
or start the Discord bot. The bot source must be provided separately.
