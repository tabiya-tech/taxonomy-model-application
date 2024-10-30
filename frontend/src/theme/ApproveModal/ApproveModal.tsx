import React from "react";
import PrimaryButton from "src/theme/PrimaryButton/PrimaryButton";
import CancelButton from "src/theme/CancelButton/CancelButton";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

interface ApproveModalProps {
  title: string;
  content: React.ReactElement;
  isOpen: boolean;
  onCancel: () => void;
  onApprove: () => void;
  cancelButtonText: string;
  approveButtonText: string;
}

const uniqueId = "edc0ac15-67a7-4c1f-9934-94fa65757046";

export const DATA_TEST_ID = {
  APPROVE_MODEL: `approve-model-${uniqueId}`,
  APPROVE_MODEL_TITLE: `approve-model-title-${uniqueId}`,
  APPROVE_MODEL_CONTENT: `approve-model-content-${uniqueId}`,
  APPROVE_MODEL_CANCEL: `approve-model-cancel-${uniqueId}`,
  APPROVE_MODEL_CONFIRM: `approve-model-confirm-${uniqueId}`,
};

const ApproveModal: React.FC<ApproveModalProps> = (props) => {
  return (
    <Dialog
      open={props.isOpen}
      onClose={props.onCancel}
      aria-labelledby="approve-model"
      data-testid={DATA_TEST_ID.APPROVE_MODEL}
      PaperProps={{
        sx: { padding: 4 },
      }}
    >
      <DialogTitle id="approve-model-title" data-testid={DATA_TEST_ID.APPROVE_MODEL_TITLE}>
        {props.title}
      </DialogTitle>
      <DialogContent data-testid={DATA_TEST_ID.APPROVE_MODEL_CONTENT} sx={{ marginTop: 4 }}>
        {props.content}
      </DialogContent>
      <DialogActions>
        <CancelButton onClick={props.onCancel} data-testid={DATA_TEST_ID.APPROVE_MODEL_CANCEL}>
          {props.cancelButtonText}
        </CancelButton>
        <PrimaryButton onClick={props.onApprove} data-testid={DATA_TEST_ID.APPROVE_MODEL_CONFIRM}>
          {props.approveButtonText}
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
};

export default ApproveModal;
