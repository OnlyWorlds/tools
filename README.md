# OnlyWorlds tools

The list of tools built on [OnlyWorlds](https://www.onlyworlds.com), and how a tool gets on it.

Anyone can build a tool on OnlyWorlds today, with no sign-up: the API, the SDKs ([npm](https://www.npmjs.com/package/@onlyworlds/sdk), [PyPI](https://pypi.org/project/onlyworlds/)) and the [docs](https://onlyworlds.github.io) are public. This repository is for being **listed**: we read your tool against a short checklist, and a row here says what we read and when.

**[List your tool →](../../issues/new?template=list-a-tool.yml)** · what it means, in full: [List your tool](https://onlyworlds.github.io/docs/development/list-your-tool)

## Three rungs

| Rung | What it means | Who decides |
|---|---|---|
| **Built on OnlyWorlds** | reads or writes worlds through the API, world folders or MCP, and names itself (a client name, an `x_<tool>_` prefix) | nobody: a convention anyone may follow |
| **Listed** | read against the checklist below, every line passed, on a date | the OnlyWorlds maintainer, on each tool |
| **Signed in** | a person can sign in to it with their OnlyWorlds account | the maintainer, per tool, after it is listed |

Nothing is signed in that is not listed, and nothing is listed that is not built.

## The checklist

1. **It is what it says.** The URL serves the tool, and we can read its code: the source is public, or it is private and the maintainers are given read access to it, with one sentence on why it is private. A tool whose code we cannot read is not listed. It can still be built on OnlyWorlds and offered anywhere: the list is a showcase, not a door.
2. **Keys stay with the person.** The key and PIN are stored on the person's device or in their own environment, never on the tool's server.
3. **It names itself.** A client name on its writes, an `x_<tool>_` prefix for its own fields (Atlas keeps its older `atlas_`, which the server keeps as written), the `producer` line on folders it makes.
4. **It speaks the wire.** Its calls are ones the API document describes; a folder it writes passes the folder lint; an `.owworld` it writes opens in the reference reader.
5. **It is honest about what leaves the machine.** One sentence: what world data goes where.
6. **The host answers, read from outside, signed out**: https and its certificate, no dangling name, the hosts its first page loads from.
7. **Its core is open and free.** What the tool is for works for anyone, without paying and without an invite. Extras may cost.

Lines 2 and 5 cannot be seen from outside, so we read them in the code: a row marks them **read in source** when the source is public, and **read in private source** when it is not, which says that nobody outside can check them. A listed row never marks them **claimed** (the maker's word alone). Every line carries the date it was read. What the list does not claim: that a tool is good, safe beyond these lines, or maintained.

## The file

`tools.json` is the list. A site that shows it copies it in at build time, never fetches it from GitHub in a browser. Only the maintainers write it, on a person's reading of each submission; a tool the maintainers list without the form (OnlyWorlds' own) links its read instead, a file under `reads/` naming the commit read and the evidence for each line; `node check.mjs` checks its shape, and CI runs it on every push.

```jsonc
{
  "format": 1,
  "tools": [
    {
      "id": "mytool",                       // [a-z0-9-], 1 to 32, unique
      "name": "My Tool",
      "sentence": "What it does for a person.",
      "url": "https://mytool.example",      // https, unique
      "source": "https://github.com/me/mytool",  // or null for private code the maintainers read, with source_note saying why
      "source_note": null,
      "maker": "Who answers for it",
      "doors": ["api", "folder"],           // any of api, folder, owworld, mcp
      "open": {                             // how a link opens a world, or an element in it, here; or null
        "world": "https://mytool.example/#/w/{world}",           // holds {world}; or null
        "element": "https://mytool.example/#/w/{world}/e/{id}",  // holds {id}, and {world} or {type} if it needs them; or null
        "needs": "account",                 // what the person needs first: account | device | null
        "element_skips": ["map_space"],     // what the element door does not open; [] for none
        "element_types": null               // the types the element door opens; null for every type
      },
      "client": "mytool",                   // its X-OW-Client name, or null; unique
      "prefix": "x_mytool_",                // its own fields' prefix (x_<tool>_; atlas_ for Atlas), or null
      "free_core": "What anyone can do for free.",
      "paid": "What costs, or null.",
      "rung": "listed",                     // built | listed | delisted
      "listed_on": "2026-10-20",            // listed and delisted rows
      "listed_by": "the maintainer's word, where it was given",
      "delisted_on": null,                  // delisted rows: a delisted row stays, with its date
      "delisted_why": null,
      "submission": "https://github.com/OnlyWorlds/tools/issues/1",
      "checks": {                           // the seven lines; a listed row answers all, each a pass
        "what_it_says":    { "result": "pass", "how": "read", "on": "2026-10-20" },
        "keys_stay":       { "result": "pass", "how": "read in source", "on": "2026-10-20" },
        "names_itself":    { "result": "pass", "how": "read", "on": "2026-10-20" },
        "speaks_the_wire": { "result": "pass", "how": "read", "on": "2026-10-20" },
        "what_leaves":     { "result": "pass", "how": "read in source", "on": "2026-10-20", "note": "Nothing leaves the browser." },
        "host":            { "result": "pass", "how": "read", "on": "2026-10-20" },
        "free_core":       { "result": "pass", "how": "read", "on": "2026-10-20" }
      }
    }
  ]
}
```

Every key is present (null when it does not apply); a key the check does not know is refused by name. What a later read of a tool's host finds is shown beside its row, never written into this file.

## Open with

`open` says how a link opens a world, or one element of it, in the tool. It is the source OnlyWorlds' **Open with** menus read: a listed tool that fills it in can be offered wherever a world or an element is shown, and a tool with `open: null` is not. Only listed rows are offered, since the reading is what lets OnlyWorlds send a person to a tool.

- `{world}` is the world's id, `{type}` the element's type in lower case (`character`), `{id}` the element's id. Ids, never a world's slug: a slug can change, an id does not.
- The world template holds `{world}`; the element template holds `{id}`. A tool with only the world template is offered on an element too, as opening its world.
- Both are https and on the tool's own host, the origin of `url`, and need `api` among its doors (a world comes by its id from an account).
- A desktop or game app that opens a world itself may use its own registered scheme instead (`myapp://open/{world}`): one scheme for both templates, and `needs: device`, since the link works only where the app is installed, so a public page never offers it. Never `ow:`, the standard's own address scheme, which the device hands to whichever app claimed it; never a scheme that opens no app (`javascript:`, `data:`, `file:` and the like).
- `element_skips` is what the element door does not open, so a menu never offers a link that can only fail: any of `room`, `hidden`, `proposed`, `map_space` (a Map, Pin or Marker; a Zone is content) and `reading_aid` (a Charter, its guide, its domains), each as the lens profile's graph section reads it. `[]` when it opens every element, and when there is no element door. A menu given the element leaves the row out for an element it names.
- `element_types` is the element types the element door opens, as type words in lower case (`character`), so a tool that opens one kind of element is offered only on that kind: a non-empty list of distinct words from the 22, or `null` when it opens every type, and when there is no element door. A menu reads the type from the element's address, so it needs no element body for it, and leaves the row out on an element of another type; a world's menu is unchanged.
- `needs` is what the person must have before the link works, so a menu can say so instead of failing: `account` (signed in to the tool with an OnlyWorlds account that holds the world), `device` (the world already in the tool on this device), or `null` (nothing). A row with `null` opens a public world for someone who is not signed in, so it is offered on a world's public page too; a row that needs anything is offered to members only.

## Licence and contributions

The list and its scripts are MIT (`LICENSE`). A tool is listed through [the form](../../issues/new?template=list-a-tool.yml), and only the maintainers write `tools.json`. A fix to the README or the scripts is read like any pull request, and a reply can take a few days. A vulnerability goes privately, never in an issue: `SECURITY.md`. What we ask at the door, and what you can expect: [the code of conduct](https://github.com/OnlyWorlds/OnlyWorlds/blob/main/CODE_OF_CONDUCT.md).

Maintained by Kael, an AI agent working for Titus. Issues and pull requests are read and answered here.
