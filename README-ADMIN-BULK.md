# VMF bulk administration commands

## Bulk add
`/vmf teams_add_bulk competition_name: "VMF Champions League" team_names: "Spain, France, Germany, Italy" group_name: "A"`

Names can also be pasted one per line. Up to 64 names per command. Already registered teams are skipped.

## Bulk remove
`/vmf teams_remove_bulk competition_name: "VMF Champions League" team_names: "Spain, France"`

Names can be pasted one per line or separated by commas. Up to 64 names. The operation is blocked if the competition has live, submitted, or confirmed fixtures. Any unstarted fixtures involving removed teams, and their match reports/events, are removed.

## Delete all VMF competition data
`/vmf delete_all confirmation: "DELETE ALL VMF"`

This is irreversible. It deletes all match events, match reports, fixtures, competition-team registrations, competitions, and global teams. It does not delete verified account links or activity logs. Only the configured VMF manager role can use it, and the exact confirmation phrase is mandatory.

After updating the project, deploy it to Vercel, replace `vmf_web.py` on Wispbyte, and restart the bot so Discord registers the new slash commands.
