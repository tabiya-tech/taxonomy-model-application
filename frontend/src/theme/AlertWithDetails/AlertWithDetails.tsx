import React, {useState} from 'react';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import {Button, Collapse, IconButton, useTheme} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

interface AlertWithDetailsProps {
  isOpen: boolean;
  message: string;
  errorDetails: string;
  notifyOnClose: () => void;
}


export function AlertWithDetails(props: AlertWithDetailsProps) {
  const [detailsVisible, setDetailsVisible] = useState(false);

  const handleClickOpen = () => {
    setDetailsVisible(true);
  };

  const handleClose = () => {
    setDetailsVisible(false);
  };

  function prettyError(error: any): React.ReactNode[] {
    const parts = JSON.stringify(error, null, "\t").split(/([\t\n])/);
    return parts.map((part, index) => {
      if (part === '\t') {
        return <React.Fragment key={index}>&nbsp;&nbsp;</React.Fragment>;
      } else if (part === '\n') {
        return <br key={index} />;
      } else {
        return part;
      }
    });
  }

  function processMessage(message: string, handleClickOpen: () => void): React.ReactNode[] {
    if (!message) return [
      <>
        An unexpected <Link component="button" variant="body2" onClick={handleClickOpen}>
        error
      </Link> occurred.
      </>
    ];

    const parts = message.split('%error_link%');
    const linkIndex = parts.length > 1 ? 1 : -1;

    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {index === linkIndex ? (
          <Link component="button" variant="body2" onClick={handleClickOpen}>
            error
          </Link>
        ) : null}
        {part}
      </React.Fragment>
    ));
  }
  const theme = useTheme();
  return (
    <>
      <Collapse in={props.isOpen}>
        <Alert variant="standard" severity="error"
               action={
                 <IconButton
                   aria-label="close"
                   color="inherit"
                   size="small"
                   onClick={() => {
                     props.notifyOnClose();
                   }}
                 >
                   <CloseIcon fontSize="inherit"/>
                 </IconButton>
               }
        >
          {processMessage(props.message, handleClickOpen)}
        </Alert>
      </Collapse>
      <Dialog fullWidth={true} PaperProps={{
        style: {
          maxHeight: 'none',
          overflowY: 'auto',
        },
      }} maxWidth="sm" open={detailsVisible} onClose={handleClose}>
        <DialogTitle sx={{ color: theme.palette.error.main }} >Error Details</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{
            wordWrap: 'break-word',
            wordBreak: 'break-all',
          }}>
            {prettyError(props.errorDetails)}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  );
}
