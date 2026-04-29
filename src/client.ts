export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: { message: string; locations?: unknown; path?: unknown }[];
}

export class WikiJSClient {
  private readonly url: string;
  private readonly token: string;

  constructor() {
    const url = process.env.WIKIJS_URL;
    const token = process.env.WIKIJS_TOKEN;
    if (!url) throw new Error("WIKIJS_URL environment variable is required");
    if (!token) throw new Error("WIKIJS_TOKEN environment variable is required");
    this.url = url.replace(/\/$/, "") + "/graphql";
    this.token = token;
  }

  async query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const json = (await res.json()) as GraphQLResponse<T>;

    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }

    return json.data as T;
  }
}
