# Repository instructions

`AGENTS.md` is the shared source of repository rules. Agent-specific instruction
files import it or direct their agent to read it. Update shared policy here
instead of copying it into each agent's entry point.

## Technical blog writing

Apply these rules when creating or editing technical articles in this repository.

- Write in English, using Andrea Tontini's first-person voice for verified contributions. Keep the prose technical, precise, and readable.
- Explain the original problem, the implemented behavior, and why the design addresses the problem. Include the relevant constraints, preserved invariants, and costs of the decision. Place rationale beside the implementation it explains.
- Ground personal motivations in the author's statements, PR descriptions, commit messages, design documents, or comments. Code can support a technical explanation of a tradeoff, but cannot establish an undocumented personal intention. Label uncertain interpretations as inferences or describe them neutrally as implementation tradeoffs.
- Discuss alternatives when supported by evidence or when a concrete comparison explains the chosen design. Do not invent rejected proposals, historical discussions, or reasons the author never gave.
- Verify authorship, merge status, and the final merged implementation. State the article's cutoff date when covering evolving work. Exclude unmerged features from claims about delivered behavior, and explain superseded designs when necessary.
- Link substantive claims to primary sources, preferably merged PRs and commit-pinned source or documentation. Distinguish the contribution from the surrounding project's existing capabilities and collaborators' work.
- Explain algorithms, ownership, lifetimes, concurrency, configuration precedence, invalidation, and failure behavior where they affect the decision. Define complexity variables and distinguish costs of one phase from the whole operation.
- Report benchmark workload, environment, metric, baseline, and uncertainty relevant to a claim. Keep allocation activity, live memory, RSS, throughput, and latency distinct. Do not turn an optimization's intended benefit into a measured outcome or generalize beyond the evidence.
- State material limitations and incomplete behavior, especially when command names or PR titles suggest broader functionality than the merged code implements.
- Use accurate, minimal examples. Identify configuration fragments that must be merged into existing files. Check commands and options against the implementation being described.
- Organize long contribution histories into coherent articles by technical theme. Avoid repeating a PR inventory where an explanation of interacting decisions is clearer.

## Site conventions and validation

- Follow `README.md` for the Jekyll post format and local validation commands. Use `_posts/YYYY-MM-DD-short-title.md`, real publication dates, descriptive front matter, and body headings beginning at `##`.
- Preserve existing published URLs, filenames, dates, and categories unless the user requests a change with an appropriate redirect plan. Preserve unrelated content.
- Check front matter, fenced examples, links, and whitespace. Run the production Jekyll build and relevant site checks when the dependencies are available. If a check cannot run, report that limitation without claiming rendered output was validated.
- Keep changes local unless committing, pushing, or publishing is authorized by the user.

## Source exploration

- Prefer available TokenSave MCP tools for indexed code exploration: check `tokensave_status` before relying on the graph, start with `tokensave_context`, and use `tokensave_search` for known symbols or literal text.
- Use `tokensave_read` for source inspection and the harness's file-read mechanism for files about to be edited. Discover additional TokenSave tools through `tokensave_more` when needed.
- If an index is missing or stale, disclose that limitation and use read-only source inspection. Do not initialize or update another repository's index unless authorized. Use ordinary filesystem tools for article content and other non-code tasks.
