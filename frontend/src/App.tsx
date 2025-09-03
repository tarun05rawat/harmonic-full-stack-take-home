import "./App.css";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Badge,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Folder,
  FolderSpecial,
  History,
  Notifications,
  Menu as MenuIcon,
} from "@mui/icons-material";
import CompanyTable from "./components/CompanyTable";
import { getCollectionsMetadata, ICollection } from "./utils/jam-api";
import useApi from "./utils/useApi";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#f97316", // Orange color from your current design
    },
    secondary: {
      main: "#3b82f6",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1f2937",
        },
      },
    },
  },
});

function App() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      message: string;
      type: "success" | "error" | "info";
      timestamp: Date;
    }>
  >([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data: collectionResponse, loading } = useApi(
    () => getCollectionsMetadata(),
    [refreshTrigger]
  );

  useEffect(() => {
    if (collectionResponse && !selectedCollectionId) {
      setSelectedCollectionId(collectionResponse[0]?.id);
    }
  }, [collectionResponse, selectedCollectionId]);

  useEffect(() => {
    if (selectedCollectionId) {
      window.history.pushState({}, "", `?collection=${selectedCollectionId}`);
    }
  }, [selectedCollectionId]);

  // Handle URL parameters on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const collectionFromUrl = urlParams.get("collection");
    if (
      collectionFromUrl &&
      collectionResponse?.some((c) => c.id === collectionFromUrl)
    ) {
      setSelectedCollectionId(collectionFromUrl);
    }
  }, [collectionResponse]);

  const handleTransferComplete = () => {
    // Trigger a refresh of collections metadata to update counts
    setRefreshTrigger((prev) => prev + 1);

    // Add success notification
    const notification = {
      id: Date.now().toString(),
      message: "Companies transferred successfully!",
      type: "success" as const,
      timestamp: new Date(),
    };
    setNotifications((prev) => [notification, ...prev.slice(0, 9)]);
    setSnackbarOpen(true);
  };

  const currentCollection = collectionResponse?.find(
    (c) => c.id === selectedCollectionId
  );

  const CollectionIcon = ({ collectionName }: { collectionName: string }) => {
    if (
      collectionName.toLowerCase().includes("liked") ||
      collectionName.toLowerCase().includes("favorite")
    ) {
      return <FolderSpecial color="secondary" />;
    }
    return <Folder />;
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setSidebarOpen(true)}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <span className="font-bold">Harmonic</span> Collection Manager
          </Typography>

          <Badge badgeContent={notifications.length} color="primary">
            <IconButton color="inherit">
              <Notifications />
            </IconButton>
          </Badge>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
        {/* Sidebar */}
        <Drawer
          variant="temporary"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{ display: { xs: "block", md: "none" } }}
        >
          <CollectionSidebar />
        </Drawer>

        {/* Desktop Sidebar */}
        <Box
          sx={{
            width: 280,
            display: { xs: "none", md: "block" },
            borderRight: "1px solid #374151",
          }}
        >
          <CollectionSidebar />
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ) : selectedCollectionId && collectionResponse ? (
            <CompanyTable
              selectedCollectionId={selectedCollectionId}
              collections={collectionResponse}
              onTransferComplete={handleTransferComplete}
            />
          ) : (
            <Alert severity="info">Select a collection to view companies</Alert>
          )}
        </Box>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          {notifications[0]?.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );

  function CollectionSidebar() {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Collections
        </Typography>

        <List>
          {collectionResponse?.map((collection) => (
            <ListItem
              key={collection.id}
              button
              selected={selectedCollectionId === collection.id}
              onClick={() => {
                setSelectedCollectionId(collection.id);
                setSidebarOpen(false);
              }}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                },
              }}
            >
              <ListItemIcon>
                <CollectionIcon collectionName={collection.collection_name} />
              </ListItemIcon>
              <ListItemText
                primary={collection.collection_name}
                secondary={
                  <Chip
                    label={`${collection.total || 0} companies`}
                    size="small"
                    variant="outlined"
                  />
                }
              />
            </ListItem>
          ))}
        </List>

        {/* Recent Activity */}
        {notifications.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, display: "flex", alignItems: "center" }}
            >
              <History fontSize="small" sx={{ mr: 1 }} />
              Recent Activity
            </Typography>
            <List dense>
              {notifications.slice(0, 3).map((notification) => (
                <ListItem key={notification.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={notification.message}
                    secondary={notification.timestamp.toLocaleTimeString()}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    );
  }
}

export default App;
