import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Button,
  Checkbox,
  IconButton,
  Chip,
  LinearProgress,
  Typography,
  TextField,
  InputAdornment,
  Alert,
  Pagination,
} from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  SelectAll,
  Clear,
  Search,
  SwapHoriz,
  PlayArrow,
  Pause,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { getCollectionsById, ICompany, ICollection } from "../utils/jam-api";
import { toggleFavorite } from "../utils/favorites-api";
import { startTransfer, getJobStatus, JobStatus } from "../utils/transfer-api";
import TransferDialog from "./TransferDialog";

const FAVORITES_LIST_ID = "8234603c-c6e6-40cb-882c-c3d1e9c4ade8";

interface CompanyTableProps {
  selectedCollectionId: string;
  collections: ICollection[];
  onTransferComplete?: () => void;
}

const CompanyTable = ({
  selectedCollectionId,
  collections,
  onTransferComplete,
}: CompanyTableProps) => {
  const [response, setResponse] = useState<ICompany[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50); // Companies per page

  // Transfer state
  const [activeJobs, setActiveJobs] = useState<Map<string, JobStatus>>(
    new Map()
  );
  const [transferHistory, setTransferHistory] = useState<
    Array<{
      id: string;
      sourceList: string;
      targetList: string;
      count: number;
      timestamp: Date;
    }>
  >([]);

  // Filtered companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return response;
    return response.filter((company) =>
      company.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [response, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  // Event handlers
  const handleSelectAll = useCallback(() => {
    const visibleIds = new Set(filteredCompanies.map((c) => c.id));
    setSelected(visibleIds);
  }, [filteredCompanies]);

  const handleSelectNone = useCallback(() => {
    setSelected(new Set());
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "a":
            e.preventDefault();
            handleSelectAll();
            break;
          case "d":
            e.preventDefault();
            handleSelectNone();
            break;
        }
      }
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        // Toggle selection on focused row
      }
      // Pagination shortcuts
      if (e.key === "ArrowLeft" && e.altKey && currentPage > 1) {
        e.preventDefault();
        setCurrentPage(currentPage - 1);
      }
      if (e.key === "ArrowRight" && e.altKey && currentPage < totalPages) {
        e.preventDefault();
        setCurrentPage(currentPage + 1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSelectAll, handleSelectNone, currentPage, totalPages]);

  // Load companies with pagination
  useEffect(() => {
    setLoading(true);
    const offset = (currentPage - 1) * pageSize;
    getCollectionsById(selectedCollectionId, offset, pageSize)
      .then((newResponse) => {
        setResponse(newResponse.companies ?? []);
        setTotal(newResponse.total ?? 0);
        setSelected(new Set()); // reset selection on data change
      })
      .finally(() => setLoading(false));
  }, [selectedCollectionId, currentPage, pageSize]);

  // Reset to first page when collection changes
  useEffect(() => {
    setCurrentPage(1);
    setSelected(new Set());
    setSearchTerm("");
  }, [selectedCollectionId]);

  // Reset page when search term changes
  useEffect(() => {
    if (searchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  // Poll active jobs
  useEffect(() => {
    if (activeJobs.size === 0) return;

    const interval = setInterval(async () => {
      const newJobs = new Map(activeJobs);
      for (const [jobId, job] of activeJobs) {
        if (job.status === "completed" || job.status === "failed") continue;

        try {
          const updatedJob = await getJobStatus(jobId);
          newJobs.set(jobId, updatedJob);

          if (updatedJob.status === "completed") {
            // Add to history
            const sourceList =
              collections.find((c) => c.id === selectedCollectionId)
                ?.collection_name || "Unknown";
            setTransferHistory((prev) => [
              {
                id: jobId,
                sourceList,
                targetList: "Favorites", // Could be dynamic
                count: updatedJob.inserted_count,
                timestamp: new Date(),
              },
              ...prev.slice(0, 9),
            ]); // Keep last 10

            onTransferComplete?.();
          }
        } catch (error) {
          console.error("Failed to poll job status:", error);
        }
      }
      setActiveJobs(newJobs);
    }, 500);

    return () => clearInterval(interval);
  }, [activeJobs, collections, selectedCollectionId, onTransferComplete]);

  const handleFavoriteToggle = async (companyId: number, liked: boolean) => {
    setResponse((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, liked } : c))
    );
    try {
      await toggleFavorite(FAVORITES_LIST_ID, companyId, liked);
    } catch (e) {
      setResponse((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, liked: !liked } : c))
      );
      console.error("Toggle failed", e);
    }
  };

  const handleSelect = (companyId: number) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(companyId)) {
        copy.delete(companyId);
      } else {
        copy.add(companyId);
      }
      return copy;
    });
  };

  const handleBulkTransfer = async (mode: "selected" | "all") => {
    const targetListId = FAVORITES_LIST_ID; // Could be made dynamic

    try {
      const result = await startTransfer({
        source_list_id: selectedCollectionId,
        target_list_id: targetListId,
        selection:
          mode === "selected"
            ? { mode: "ids", ids: Array.from(selected) }
            : { mode: "all" },
      });

      setActiveJobs(
        (prev) =>
          new Map(
            prev.set(result.job_id, {
              job_id: result.job_id,
              status: "queued",
              total_count: mode === "selected" ? selected.size : total,
              processed_count: 0,
              inserted_count: 0,
              skipped_count: 0,
              failed_count: 0,
              error: undefined,
            })
          )
      );

      if (mode === "selected") {
        setSelected(new Set());
      }
    } catch (error) {
      console.error("Transfer failed:", error);
    }
  };

  const currentCollection = collections.find(
    (c) => c.id === selectedCollectionId
  );
  const isAllSelected =
    selected.size === filteredCompanies.length && filteredCompanies.length > 0;
  const isPartiallySelected =
    selected.size > 0 && selected.size < filteredCompanies.length;

  return (
    <div className="space-y-4">
      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TextField
            size="small"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            className="w-64"
          />

          {searchTerm && (
            <Chip
              label={`${filteredCompanies.length} of ${response.length} on page`}
              size="small"
              variant="outlined"
            />
          )}

          {!searchTerm && (
            <Chip
              label={`Page ${currentPage} of ${totalPages}`}
              size="small"
              variant="outlined"
            />
          )}
        </div>

        <div className="text-sm text-gray-400">
          {selected.size > 0 && (
            <span className="mr-4">{selected.size} selected</span>
          )}
          <kbd className="px-2 py-1 text-xs bg-gray-700 rounded">⌘+A</kbd>{" "}
          Select All
          <span className="mx-2">•</span>
          <kbd className="px-2 py-1 text-xs bg-gray-700 rounded">⌘+D</kbd>{" "}
          Deselect
          <span className="mx-2">•</span>
          <kbd className="px-2 py-1 text-xs bg-gray-700 rounded">
            ⌥+←/→
          </kbd>{" "}
          Pages
        </div>
      </div>

      {/* Search Notice */}
      {searchTerm && (
        <Alert severity="info" className="mb-2">
          Search is active and filtering current page results (
          {filteredCompanies.length} of {response.length} on this page). Use
          pagination to see more companies or refine your search.
        </Alert>
      )}

      {/* Selection Controls */}
      {filteredCompanies.length > 0 && (
        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={isAllSelected}
              indeterminate={isPartiallySelected}
              onChange={isAllSelected ? handleSelectNone : handleSelectAll}
              icon={<SelectAll />}
              checkedIcon={<SelectAll />}
            />
            <Typography variant="body2">
              {isAllSelected
                ? "All selected"
                : isPartiallySelected
                ? `${selected.size} selected`
                : "None selected"}
            </Typography>
          </div>

          <div className="flex items-center space-x-2">
            {selected.size > 0 && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SwapHoriz />}
                  onClick={() => handleBulkTransfer("selected")}
                >
                  Transfer Selected ({selected.size})
                </Button>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<Clear />}
                  onClick={handleSelectNone}
                >
                  Clear
                </Button>
              </>
            )}

            <Button
              size="small"
              variant="outlined"
              startIcon={<SwapHoriz />}
              onClick={() => handleBulkTransfer("all")}
            >
              Transfer All ({total})
            </Button>
          </div>
        </div>
      )}

      {/* Active Jobs Progress */}
      {Array.from(activeJobs.values()).map((job) => (
        <Alert
          key={job.job_id}
          severity={
            job.status === "completed"
              ? "success"
              : job.status === "failed"
              ? "error"
              : "info"
          }
          icon={
            job.status === "completed" ? (
              <CheckCircle />
            ) : job.status === "failed" ? (
              <ErrorIcon />
            ) : job.status === "running" ? (
              <PlayArrow />
            ) : (
              <Pause />
            )
          }
          className="mb-2"
        >
          <div className="w-full">
            <div className="flex justify-between items-center mb-1">
              <Typography variant="body2" className="font-medium">
                {job.status === "completed"
                  ? "Transfer Complete"
                  : job.status === "failed"
                  ? "Transfer Failed"
                  : job.status === "running"
                  ? "Transferring Companies..."
                  : "Transfer Queued"}
              </Typography>
              <Typography variant="caption">
                {job.processed_count} / {job.total_count}
              </Typography>
            </div>

            {job.status !== "completed" && job.status !== "failed" && (
              <LinearProgress
                variant="determinate"
                value={(job.processed_count / job.total_count) * 100}
                className="mb-2"
              />
            )}

            <div className="flex space-x-4 text-xs text-gray-600">
              <span>Added: {job.inserted_count}</span>
              <span>Skipped: {job.skipped_count}</span>
              {job.failed_count > 0 && <span>Failed: {job.failed_count}</span>}
            </div>

            {job.error && (
              <Typography
                variant="caption"
                color="error"
                className="mt-1 block"
              >
                Error: {job.error}
              </Typography>
            )}
          </div>
        </Alert>
      ))}

      {/* Transfer History */}
      {transferHistory.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-3">
          <Typography variant="subtitle2" className="mb-2">
            Recent Transfers
          </Typography>
          <div className="space-y-1">
            {transferHistory.slice(0, 3).map((transfer) => (
              <div
                key={transfer.id}
                className="text-sm text-gray-400 flex justify-between"
              >
                <span>
                  Transferred {transfer.count} companies to{" "}
                  {transfer.targetList}
                </span>
                <span>{transfer.timestamp.toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Table */}
      <div className="overflow-x-auto border rounded-lg">
        {loading && <LinearProgress />}

        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-800 text-gray-200 uppercase">
            <tr>
              <th className="px-3 py-2 w-10"></th>
              <th className="px-3 py-2 w-10"></th>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Company Name</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((company) => (
              <tr
                key={company.id}
                className={`border-b border-gray-700 hover:bg-gray-750 transition-colors ${
                  selected.has(company.id) ? "bg-blue-900/30" : ""
                }`}
              >
                {/* Selection checkbox */}
                <td className="px-3 py-2 text-center">
                  <Checkbox
                    size="small"
                    checked={selected.has(company.id)}
                    onChange={() => handleSelect(company.id)}
                  />
                </td>

                {/* Heart icon */}
                <td className="px-3 py-2 text-center">
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleFavoriteToggle(company.id, !company.liked)
                    }
                    color={company.liked ? "error" : "default"}
                  >
                    {company.liked ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                </td>

                {/* Company info */}
                <td className="px-3 py-2 text-gray-300">{company.id}</td>
                <td className="px-3 py-2 font-medium">
                  {company.company_name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-3 text-gray-400 text-sm bg-gray-800 flex justify-between items-center">
          <span>
            Showing {startIndex}-{endIndex} of {total} companies
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </span>
          <span className="text-xs">{currentCollection?.collection_name}</span>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            className="bg-gray-800 rounded-lg p-2"
          />
        </div>
      )}

      {/* Transfer Dialog */}
      <TransferDialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        collections={collections}
        selectedCount={selected.size}
        onTransfer={(_sourceId, _targetId, mode) => {
          // For now, we're using the current collection as source
          // In the future, this could be made more flexible
          handleBulkTransfer(mode);
        }}
        defaultSourceId={selectedCollectionId}
      />
    </div>
  );
};

export default CompanyTable;
