# Working in this repository

## What this is

The public list of tools built on OnlyWorlds, `tools.json`, with the scripts that check its shape. What a listing means, the seven-line checklist and every key of a row are in `README.md`.

## Who writes what

Only the maintainer writes `tools.json` and the files under `reads/`, each row after a person has read the tool against the checklist. So:

- To get a tool listed, open an issue with the "List a tool" form (`.github/ISSUE_TEMPLATE/list-a-tool.yml`). A pull request that adds or edits a row is not the way in.
- A listed tool that is wrong or out of date is an ordinary issue. A vulnerability goes through GitHub's private vulnerability reporting, never an issue: `SECURITY.md`.
- A pull request is for `README.md`, `check.mjs`, `test.mjs` and `commit-words.mjs`.

Issues and pull requests from anyone are welcome, and the maintainer answers them here.

## Run the checks

You need Node.js 22 (what CI uses) and nothing else: there is no `package.json` and nothing to install. Run these from the repository root before you call a change done:

```bash
node check.mjs                              # tools.json against its shape; a clean file ends "PASS: N row(s): ..."
node test.mjs                               # the README's example row passes, and each mutant fails naming its cause
node commit-words.mjs origin/master..HEAD   # your commit messages
```

`check.mjs` takes an optional path (`node check.mjs path/to/tools.json`) and exits 0 on a clean file, 1 on any problem, each named with its row and key. It checks shape only: whether a row's answers are true is the reading, not the script.

`test.mjs` takes the `jsonc` block in `README.md` as the fixture: it strips the comments, runs `check.mjs` on it, then on each mutant in its `MUTANTS` list, and wants each mutant to fail with the words it names. So the documented row and the check cannot drift apart.

`commit-words.mjs` exits 0 when clean, 1 on a finding (each printed with the commit and line), and 2 when git cannot read the range, as on a shallow clone: 2 is not a pass. Clone with full history.

Both live in `.github/workflows/check.yml`, which runs on every push and pull request: the job `check` runs `node check.mjs` and `node test.mjs`; the job `commits` runs `commit-words.mjs` over the commits the push or pull request adds.

## How a change reaches master

The default branch is `master`. It takes a commit only when the required check `check` passed on it, and the rule has no bypass, so a direct push is refused, as are a force push and deleting the branch. Every change goes through a pull request: work on a branch (a fork is fine), open the pull request, and wait for the checks. The `commits` job is not required; say in your pull request if it is red. The maintainer reviews and merges; you never merge your own pull request.

## Rules a newcomer would break

- A change to a row's shape changes three files together: the rule in `check.mjs`, the `jsonc` example and its prose in `README.md`, and a mutant in `test.mjs` that breaks the new rule and must fail. A rule with no mutant is untested; an example that fails the check fails `test.mjs`.
- `check.mjs` refuses any key it does not know, by name. A new key is added to the check, the README and the example in the same change.
- Dates in the example and in rows are `YYYY-MM-DD` and may not be in the future; a listed row's checks may not be dated after its `listed_on`.
- No dependencies. Each script uses Node's own modules only.
- Text files are LF (`.gitattributes`).

## What not to change

- `tools.json` and `reads/`: see "Who writes what".
- Never edit a file under `.github/workflows/`.

## Commit messages

A commit message is public. Its subject is one line of about 100 characters at most, and the rest goes in the body. It says what the change does and why, in plain words, and names no private repository, person or internal ticket. `commit-words.mjs` holds your messages to a list of words that do not belong in public text.

## Where to stop and ask

Stop, and do not guess, when the job would need a change to `tools.json`, `reads/` or a workflow, a dependency, a change to what a row may hold that the job did not name, or a failing check you cannot explain, including one that also fails on `master`. Write one question in your pull request (or in an issue, if there is no pull request yet), push your branch as it stands, and end your turn.

## What a finished pull request says

What changed, and why; each command above you ran, with its last line of output; what you did not run, and why; and anything outside the job that looked wrong and was left alone.
