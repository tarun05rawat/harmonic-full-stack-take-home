import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Add, Warning } from "@mui/icons-material";

interface CreateCollectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (collectionName: string) => void;
  existingNames: string[];
}

const CreateCollectionDialog: React.FC<CreateCollectionDialogProps> = ({
  open,
  onClose,
  onSuccess,
  existingNames,
}) => {
  const [collectionName, setCollectionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setCollectionName("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!collectionName.trim()) {
      setError("Collection name is required");
      return;
    }

    if (
      existingNames.some(
        (name) => name.toLowerCase() === collectionName.trim().toLowerCase()
      )
    ) {
      setError("A collection with this name already exists");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      onSuccess(collectionName.trim());
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create collection"
      );
    } finally {
      setLoading(false);
    }
  };

  const isValidName =
    collectionName.trim().length > 0 &&
    !existingNames.some(
      (name) => name.toLowerCase() === collectionName.trim().toLowerCase()
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: "300px" },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Add />
          Create New Collection
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new collection to organize your companies. You can transfer
            companies between collections at any time.
          </Typography>

          <TextField
            autoFocus
            margin="dense"
            label="Collection Name"
            fullWidth
            variant="outlined"
            value={collectionName}
            onChange={(e) => {
              setCollectionName(e.target.value);
              setError(null);
            }}
            error={!!error}
            helperText={error}
            placeholder="e.g., High Priority Companies"
            disabled={loading}
          />

          {/* Name validation feedback */}
          {collectionName.trim() && !isValidName && !error && (
            <Alert severity="warning" sx={{ mt: 2 }} icon={<Warning />}>
              A collection with this name already exists
            </Alert>
          )}

          {/* Existing collections info */}
          {existingNames.length > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: "block" }}
            >
              Existing collections: {existingNames.join(", ")}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValidName || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Add />}
          >
            {loading ? "Creating..." : "Create Collection"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateCollectionDialog;
