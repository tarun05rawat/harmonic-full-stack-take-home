import { useState, useCallback } from "react";
import { startTransfer, getJobStatus, JobStatus } from "../utils/transfer-api";
import { SYSTEM_COLLECTIONS, JOB_POLLING, JOB_STATUS } from "../constants";

/**
 * Custom hook for managing company transfer operations
 * Handles the complete transfer lifecycle including job polling
 */
export const useTransfer = () => {
  const [transferJob, setTransferJob] = useState<JobStatus | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  /**
   * Polls a transfer job until completion or failure
   * @param jobId - ID of the job to poll
   * @returns Promise that resolves when job is complete
   */
  const pollJobStatus = useCallback(
    async (jobId: string): Promise<JobStatus> => {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkStatus = async () => {
          try {
            const status = await getJobStatus(jobId);
            setTransferJob(status);

            // Job completed successfully or failed
            if (
              status.status === JOB_STATUS.COMPLETED ||
              status.status === JOB_STATUS.FAILED
            ) {
              resolve(status);
              return;
            }

            // Check for timeout
            if (Date.now() - startTime > JOB_POLLING.MAX_POLL_TIME) {
              reject(new Error("Transfer job timed out"));
              return;
            }

            // Continue polling
            setTimeout(checkStatus, JOB_POLLING.POLL_INTERVAL);
          } catch (error) {
            reject(error);
          }
        };

        checkStatus();
      });
    },
    []
  );

  /**
   * Initiates a transfer operation and polls until completion
   * @param sourceListId - Source collection ID
   * @param targetListId - Target collection ID
   * @param selection - Companies to transfer (all or specific IDs)
   * @returns Promise resolving to final job status
   */
  const executeTransfer = useCallback(
    async (
      sourceListId: string,
      targetListId: string,
      selection: { mode: "ids" | "all"; ids?: number[] }
    ): Promise<JobStatus> => {
      setIsTransferring(true);
      setTransferJob(null);

      try {
        // Start the transfer
        const { job_id } = await startTransfer({
          source_list_id: sourceListId,
          target_list_id: targetListId,
          selection,
        });

        // Poll until completion
        const finalStatus = await pollJobStatus(job_id);

        return finalStatus;
      } finally {
        setIsTransferring(false);
      }
    },
    [pollJobStatus]
  );

  /**
   * Gets the transfer progress as a percentage
   */
  const getTransferProgress = useCallback((): number => {
    if (!transferJob || transferJob.total_count === 0) return 0;
    return (transferJob.processed_count / transferJob.total_count) * 100;
  }, [transferJob]);

  /**
   * Checks if current collection is the favorites collection
   */
  const isFavoritesCollection = useCallback((collectionId: string): boolean => {
    return collectionId === SYSTEM_COLLECTIONS.FAVORITES;
  }, []);

  return {
    transferJob,
    isTransferring,
    executeTransfer,
    getTransferProgress,
    isFavoritesCollection,
  };
};
