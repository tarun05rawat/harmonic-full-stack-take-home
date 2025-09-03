import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  Alert,
  Divider,
} from "@mui/material";
import { SwapHoriz, Warning } from "@mui/icons-material";
import { ICollection } from "../utils/jam-api";

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  collections: ICollection[];
  selectedCount?: number;
  onTransfer: (
    sourceId: string,
    targetId: string,
    mode: "selected" | "all"
  ) => void;
  defaultSourceId?: string;
}

const TransferDialog: React.FC<TransferDialogProps> = ({
  open,
  onClose,
  collections,
  selectedCount = 0,
  onTransfer,
  defaultSourceId,
}) => {
  const [sourceListId, setSourceListId] = useState(defaultSourceId || "");
  const [targetListId, setTargetListId] = useState("");
  const [transferMode, setTransferMode] = useState<"selected" | "all">("all");

  React.useEffect(() => {
    if (open) {
      setSourceListId(defaultSourceId || "");
      setTargetListId("");
      setTransferMode(selectedCount > 0 ? "selected" : "all");
    }
  }, [open, defaultSourceId, selectedCount]);

  const sourceCollection = collections.find((c) => c.id === sourceListId);
  const targetCollection = collections.find((c) => c.id === targetListId);

  const getTransferCount = () => {
    if (transferMode === "selected") return selectedCount;
    return sourceCollection?.total || 0;
  };

  const canTransfer =
    sourceListId && targetListId && sourceListId !== targetListId;

  const handleTransfer = () => {
    if (canTransfer) {
      onTransfer(sourceListId, targetListId, transferMode);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: "400px" },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <SwapHoriz />
        Transfer Companies
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
          {/* Transfer Mode Selection */}
          {selectedCount > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Transfer Mode
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip
                  label={`Selected (${selectedCount})`}
                  variant={transferMode === "selected" ? "filled" : "outlined"}
                  color={transferMode === "selected" ? "primary" : "default"}
                  onClick={() => setTransferMode("selected")}
                  clickable
                />
                <Chip
                  label="All Companies"
                  variant={transferMode === "all" ? "filled" : "outlined"}
                  color={transferMode === "all" ? "primary" : "default"}
                  onClick={() => setTransferMode("all")}
                  clickable
                />
              </Box>
            </Box>
          )}

          {/* Source List Selection */}
          <FormControl fullWidth>
            <InputLabel>Source List</InputLabel>
            <Select
              value={sourceListId}
              label="Source List"
              onChange={(e) => setSourceListId(e.target.value)}
            >
              {collections.map((collection) => (
                <MenuItem key={collection.id} value={collection.id}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <span>{collection.collection_name}</span>
                    <Chip
                      label={`${collection.total || 0} companies`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Arrow Indicator */}
          <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
            <SwapHoriz fontSize="large" color="primary" />
          </Box>

          {/* Target List Selection */}
          <FormControl fullWidth>
            <InputLabel>Target List</InputLabel>
            <Select
              value={targetListId}
              label="Target List"
              onChange={(e) => setTargetListId(e.target.value)}
            >
              {collections
                .filter((collection) => collection.id !== sourceListId)
                .map((collection) => (
                  <MenuItem key={collection.id} value={collection.id}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span>{collection.collection_name}</span>
                      <Chip
                        label={`${collection.total || 0} companies`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <Divider />

          {/* Transfer Summary */}
          {canTransfer && (
            <Alert severity="info" icon={<SwapHoriz />}>
              <Typography variant="body2">
                <strong>Transfer Summary:</strong>
                <br />
                Moving <strong>{getTransferCount()} companies</strong> from{" "}
                <strong>{sourceCollection?.collection_name}</strong> to{" "}
                <strong>{targetCollection?.collection_name}</strong>
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Duplicates will be automatically skipped
              </Typography>
            </Alert>
          )}

          {/* Validation Warnings */}
          {sourceListId === targetListId && sourceListId && (
            <Alert severity="warning" icon={<Warning />}>
              Source and target lists must be different
            </Alert>
          )}

          {transferMode === "selected" && selectedCount === 0 && (
            <Alert severity="warning" icon={<Warning />}>
              No companies selected. Please select companies first or choose
              "All Companies" mode.
            </Alert>
          )}

          {transferMode === "all" && sourceCollection?.total === 0 && (
            <Alert severity="warning" icon={<Warning />}>
              The source list is empty
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleTransfer}
          variant="contained"
          disabled={
            !canTransfer ||
            (transferMode === "all" && (sourceCollection?.total || 0) === 0)
          }
          startIcon={<SwapHoriz />}
        >
          Transfer {getTransferCount()} Companies
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferDialog;
