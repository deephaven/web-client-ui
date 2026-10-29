import type {
  GithubClient,
  GithubIssue,
  LinkedPullRequest,
  TimelineEvent,
} from './triageTypes.ts';
import {
  COPILOT_ASSIGN_TOKEN,
  COPILOT_ASSIGNEE,
  COPILOT_MODEL,
  COPILOT_CUSTOM_AGENT,
  COPILOT_BASE_BRANCH,
} from './triageConfig.ts';

// Minimal GitHub REST client authenticated with the given token.
function makeClient(token: string, repository: string): GithubClient {
  const [owner, repo] = (repository ?? '').split('/');
  const api = 'https://api.github.com';
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Shared fetch wrapper: throws on non-2xx, returns null for 204 responses.
  async function request<T>(
    pathname: string,
    opts: { method?: string; body?: string } = {}
  ): Promise<T | null> {
    const res = await fetch(`${api}${pathname}`, { headers, ...opts });
    if (!res.ok) {
      throw new Error(
        `${opts.method ?? 'GET'} ${pathname} -> ${res.status}: ${(
          await res.text()
        ).slice(0, 500)}`
      );
    }
    return res.status === 204 ? null : ((await res.json()) as T);
  }

  return {
    getIssue: number =>
      request<GithubIssue>(`/repos/${owner}/${repo}/issues/${number}`).then(
        issue => issue as GithubIssue
      ),
    updateIssue: (number, patch) =>
      request<GithubIssue>(`/repos/${owner}/${repo}/issues/${number}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    comment: (number, body) =>
      request(`/repos/${owner}/${repo}/issues/${number}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    createIssue: payload =>
      request<GithubIssue>(`/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }).then(issue => issue as GithubIssue),
    // Closed issues are included so a cold cache reopens the original rather than opening a
    // duplicate, which would also reset the fix-attempt count that drives escalation. Sorted
    // by recency because a recurrence is always recent and the page budget is finite.
    async fetchIssuesWithLabel(label: string): Promise<GithubIssue[]> {
      const all: GithubIssue[] = [];
      let page = 1;
      let keepGoing = true;
      while (keepGoing && page <= 5) {
        // eslint-disable-next-line no-await-in-loop
        const batch = await request<GithubIssue[]>(
          `/repos/${owner}/${repo}/issues?state=all&labels=${encodeURIComponent(
            label
          )}&sort=updated&direction=desc&per_page=100&page=${page}`
        );
        all.push(...(batch ?? []));
        keepGoing = Boolean(batch && batch.length >= 100);
        page += 1;
      }
      return all;
    },
    // Pull requests that referenced this issue, i.e. the fixes already attempted for it.
    async fetchLinkedPullRequests(
      number: number
    ): Promise<LinkedPullRequest[]> {
      const events = await request<TimelineEvent[]>(
        `/repos/${owner}/${repo}/issues/${number}/timeline?per_page=200`
      );
      const found = new Map<string, LinkedPullRequest>();
      (events ?? []).forEach(e => {
        const source = e.source?.issue;
        if (
          e.event !== 'cross-referenced' ||
          source?.pull_request === undefined ||
          source.html_url === undefined ||
          source.html_url === ''
        ) {
          return;
        }
        found.set(source.html_url, {
          url: source.html_url,
          body: source.body ?? '',
          mergedAt: source.pull_request.merged_at ?? null,
        });
      });
      return [...found.values()];
    },
    assignAgent:
      COPILOT_ASSIGN_TOKEN === ''
        ? null
        : async (number: number) => {
            // Deliberately not using request(): these calls need the user token, and
            // agent_assignment selects which custom agent picks the issue up.
            const assigneesUrl = `${api}/repos/${owner}/${repo}/issues/${number}/assignees`;
            const agentHeaders = {
              ...headers,
              Authorization: `Bearer ${COPILOT_ASSIGN_TOKEN}`,
              'GraphQL-Features':
                'issues_copilot_assignment_api_support,coding_agent_model_selection',
            };

            // Copilot only starts a session on an unassigned -> assigned transition. Closing an
            // issue does not clear its assignee, so a reopened one still carries the bot from the
            // last attempt and re-POSTing it is a silent no-op. Clear it first to force a new
            // session on a new PR; on a brand-new issue this is a harmless no-op.
            const cleared = await fetch(assigneesUrl, {
              method: 'DELETE',
              headers: agentHeaders,
              body: JSON.stringify({ assignees: [COPILOT_ASSIGNEE] }),
            });
            if (!cleared.ok) {
              console.warn(
                `Could not clear the existing assignee on #${number} (${cleared.status}); a new agent session may not start.`
              );
            }

            const res = await fetch(assigneesUrl, {
              method: 'POST',
              headers: agentHeaders,
              body: JSON.stringify({
                assignees: [COPILOT_ASSIGNEE],
                agent_assignment: {
                  target_repo: repository,
                  base_branch: COPILOT_BASE_BRANCH,
                  custom_agent: COPILOT_CUSTOM_AGENT,
                  model: COPILOT_MODEL,
                },
              }),
            });
            if (!res.ok) {
              throw new Error(
                `POST /issues/${number}/assignees -> ${res.status}: ${(
                  await res.text()
                ).slice(0, 500)}`
              );
            }
            return res.json();
          },
  };
}

export default makeClient;
