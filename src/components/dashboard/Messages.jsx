import { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Typography,
  IconButton,
  Chip,
  Collapse,
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { 
  Check as CheckIcon, 
  Mail as MailIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon
} from '@mui/icons-material';

function Messages() {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        // Ensure read status is a number
        const normalizedData = data.map(msg => ({
          ...msg,
          read: Number(msg.read)
        }));
        setMessages(normalizedData);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Toggle read status
  const toggleReadStatus = async (id, event) => {
    event?.stopPropagation();
    if (isUpdating) return; // Prevent multiple updates

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/messages/${id}/toggle-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const updatedMessage = await response.json();
        console.log('Toggle response:', updatedMessage);

        // Ensure read status is stored as a number
        const normalizedMessage = {
          ...updatedMessage,
          read: Number(updatedMessage.read)
        };

        // Update messages atomically
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === id ? normalizedMessage : msg
          )
        );
        
        // Update selected message if in dialog
        setSelectedMessage(prev => 
          prev?.id === id ? normalizedMessage : prev
        );
      }
    } catch (error) {
      console.error('Error toggling read status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Render message status consistently
  const MessageStatus = ({ read }) => (
    <Chip 
      icon={read === 1 ? <CheckIcon /> : <MailIcon />}
      label={read === 1 ? "Read" : "New"}
      color={read === 1 ? "default" : "primary"}
      size="small"
    />
  );

  const handleRowClick = (message) => {
    setSelectedMessage(message);
    setOpenDialog(true);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Contact Messages
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Preview</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.map((message) => (
              <TableRow 
                key={message.id}
                onClick={() => handleRowClick(message)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                }}
              >
                <TableCell>
                  <MessageStatus read={message.read} />
                </TableCell>
                <TableCell>{formatDate(message.created_at)}</TableCell>
                <TableCell>{message.name}</TableCell>
                <TableCell>{message.email}</TableCell>
                <TableCell>
                  {message.message.length > 50 
                    ? `${message.message.substring(0, 50)}...` 
                    : message.message}
                </TableCell>
                <TableCell>
                  <IconButton 
                    onClick={(e) => toggleReadStatus(message.id, e)}
                    size="small"
                    disabled={isUpdating}
                    title={message.read === 1 ? "Mark as unread" : "Mark as read"}
                  >
                    {message.read === 1 ? <MailIcon /> : <CheckIcon />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Message Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedMessage && (
          <>
            <DialogTitle>
              Message from {selectedMessage.name}
              <Typography variant="subtitle2" color="text.secondary">
                {formatDate(selectedMessage.created_at)}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="subtitle1" gutterBottom>
                From: {selectedMessage.email}
              </Typography>
              <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                {selectedMessage.message}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => toggleReadStatus(selectedMessage.id)}
                color="primary"
              >
                Mark as {selectedMessage.read === 1 ? 'Unread' : 'Read'}
              </Button>
              <Button onClick={() => setOpenDialog(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}

export default Messages; 