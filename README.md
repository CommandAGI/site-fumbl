# site-fumbl

The site of Fumbl, a dating app for adults built safety first, a company of CommandAGI (`org-fumbl`). A static folder
served by CommandAGI's site hosting; mounted in the CommandAGI repository at
`seed/drive/platform/org-fumbl/sites/fumbl`.

- `index.html`, `safety.html`, `about.html`: the site. The safety notice, tips and rules are the charter's
  (`companies/fumbl/charter.md` in CommandAGI's Drive).
- `app/`: the demo. Fictional sample profiles drawn as illustrations, each marked "Sample profile"; the state is in the
  browser's session storage and the page sends nothing (`connect-src 'none'`).
- `app/live.html`, `app/live.js`: the live app for real members. It signs a member in with their CommandAGI account
  (OAuth with PKCE, the client `fumbl`) and calls the api worker's `/fumbl/*` routes (`src/data/fumbl.ts` in the
  CommandAGI repository); its policy reaches only the api origins. On `127.0.0.1` or `*.localhost`, `?api=` points it
  at another api (the browser journey `tests/workbench/browser_company_apps.mjs` serves Fumbl's routes there).
- `terms.html`, `privacy.html`: the terms of use and the privacy notice.
- `team.html`, `team-*.html`, `people/`: made by `node scripts/seed/people/personas.mjs` in the CommandAGI repository.
  The team are disclosed AI agents.
