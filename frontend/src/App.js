import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Typography, Box, CircularProgress, Alert } from "@mui/material";

function App() {
  const [content, setContent] = useState(""); // Text to moderate
  const [loading, setLoading] = useState(false); // Loading state
  const [moderationResult, setModerationResult] = useState(null); // Moderation results
  const [errorMessage, setErrorMessage] = useState(""); // Error message

  // Handle moderation submission
  const handleModerate = async () => {
    if (!content.trim()) {
      setErrorMessage("Please enter some text to moderate.");
      return;
    }

    setErrorMessage(""); // Clear any existing errors
    setLoading(true); // Show loader
    setModerationResult(null); // Clear previous results

    try {
      const response = await axios.post("http://localhost:8000/moderate", { text: content }, {
        headers: { "Content-Type": "application/json" },
      });

      setModerationResult(response.data); // Set moderation results
      setLoading(false); // Hide loader
    } catch (error) {
      console.error("Error in moderation:", error.response?.data || error.message);
      setErrorMessage(
        `Failed to moderate content: ${error.response?.data?.message || "Unknown error"}`
      );
      setLoading(false); // Hide loader
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: "auto",
        p: 3,
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Text Moderation Tool
      </Typography>

      {/* Error Message */}
      {errorMessage && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Textarea for input */}
      <TextField
        label="Text Content"
        multiline
        rows={6}
        fullWidth
        value={content}
        onChange={(e) => setContent(e.target.value)}
        helperText="Enter the text you want to check for moderation."
        InputLabelProps={{ shrink: true }}
        sx={{ mt: 3 }}
      />

      {/* Submit Button */}
      <Button
        variant="contained"
        onClick={handleModerate}
        disabled={loading}
        sx={{ mt: 3 }}
      >
        {loading ? "Checking..." : "Moderate Content"}
      </Button>

      {/* Loader */}
      {loading && (
        <Box sx={{ mt: 3 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Checking content...</Typography>
        </Box>
      )}

      {/* Moderation Results */}
      {moderationResult && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Moderation Results
          </Typography>
          <pre
            style={{
              textAlign: "left",
              backgroundColor: "#f9f9f9",
              padding: "10px",
              borderRadius: "5px",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(moderationResult, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
}

export default App;