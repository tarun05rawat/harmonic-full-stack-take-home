import { buildApiUrl } from "../config/api";

export interface TransferRequest {
  source_list_id: string;
  target_list_id: string;
  selection: {
    mode: "ids" | "all";
    ids?: number[];
  };
}

export interface TransferResponse {
  job_id: string;
}

export interface JobStatus {
  job_id: string;
  status: "queued" | "running" | "completed" | "failed";
  total_count: number;
  processed_count: number;
  inserted_count: number;
  skipped_count: number;
  failed_count: number;
  error?: string;
}

export async function startTransfer(
  request: TransferRequest
): Promise<TransferResponse> {
  const response = await fetch(buildApiUrl("/transfer"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Transfer failed: ${await response.text()}`);
  }

  return response.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(buildApiUrl(`/transfer/jobs/${jobId}`));

  if (!response.ok) {
    throw new Error(`Failed to get job status: ${await response.text()}`);
  }

  return response.json();
}
