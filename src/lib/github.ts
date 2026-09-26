import { Submission } from "./types";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const DATA_FILE = "data/submissions.json";
const API_BASE = "https://api.github.com";

type GitHubFileResponse = {
  content: string;
  sha: string;
};

type GitHubErrorResponse = {
  message: string;
};

async function fetchFile(): Promise<{ content: Submission[]; sha: string } | null> {
  const url = `${API_BASE}/repos/${GITHUB_REPO}/contents/${DATA_FILE}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
    next: { revalidate: 0 },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const err: GitHubErrorResponse = await res.json();
    throw new Error(`GitHub API error: ${err.message}`);
  }

  const data: GitHubFileResponse = await res.json();
  const decoded = Buffer.from(data.content, "base64").toString("utf-8");
  return { content: JSON.parse(decoded), sha: data.sha };
}

async function commitFile(content: Submission[], sha: string | null): Promise<void> {
  const url = sha
    ? `${API_BASE}/repos/${GITHUB_REPO}/contents/${DATA_FILE}`
    : `${API_BASE}/repos/${GITHUB_REPO}/contents/${DATA_FILE}`;

  const body: Record<string, unknown> = {
    message: `Update submissions - ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
    branch: GITHUB_BRANCH,
  };

  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err: GitHubErrorResponse = await res.json();
    throw new Error(`GitHub commit error: ${err.message}`);
  }
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const file = await fetchFile();
  return file ? file.content : [];
}

export async function addSubmission(submission: Submission): Promise<Submission> {
  const file = await fetchFile();
  const submissions = file ? file.content : [];
  submissions.unshift(submission);
  await commitFile(submissions, file?.sha ?? null);
  return submission;
}

export async function updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | null> {
  const file = await fetchFile();
  if (!file) return null;

  const index = file.content.findIndex((s) => s.id === id);
  if (index === -1) return null;

  file.content[index] = { ...file.content[index], ...updates };
  await commitFile(file.content, file.sha);
  return file.content[index];
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const file = await fetchFile();
  if (!file) return false;

  const filtered = file.content.filter((s) => s.id !== id);
  await commitFile(filtered, file.sha);
  return true;
}
