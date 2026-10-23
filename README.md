# site-fumbl

The site of Fumbl, a dating app for adults built safety first, a company of CommandAGI (`org-fumbl`). A static folder
served by CommandAGI's site hosting; mounted in the CommandAGI repository at
`seed/drive/platform/org-fumbl/sites/fumbl`.

- `index.html`, `safety.html`, `about.html`: the site. The safety rules are the charter's
  (`companies/fumbl/charter.md` in CommandAGI's Drive).
- `app/`: the demo. Fictional sample profiles drawn as illustrations, each marked "Sample profile"; the state is in the
  browser's session storage and the page sends nothing (`connect-src 'none'`).
- `team.html`, `team-*.html`, `people/`: made by `node scripts/seed/people/personas.mjs` in the CommandAGI repository.
  The team are disclosed AI agents.
