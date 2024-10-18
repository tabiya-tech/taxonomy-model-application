import React, { useState } from "react";
import Button from "@mui/material/Button";
import MUIStepper from "@mui/material/Stepper";
import StepContent from "@mui/material/StepContent";
import { Step as MUIStep, StepLabel, Stack, Box, Typography } from "@mui/material";

type TStep = {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
};

type Props = {
  steps: TStep[];
};

const uniqueId = "8482f1cc-0786-423f-821e-34b6b712d63g";

export const DATA_TEST_ID = {
  CONTAINER: `stepper-root-${uniqueId}`,
  STEP_CONTAINER: `step-container-${uniqueId}`,
  STEP_LABEL: `step-label-${uniqueId}`,
  STEP_LABEL_SUBTITLE: `step-label-subtitle-${uniqueId}`,
  STEP_CONTENT: `step-content-${uniqueId}`,
  STEP_CONTENT_STACK: `step-content-stack-${uniqueId}`,
  STEP_NEXT_BUTTON: `step-next-button-${uniqueId}`,
  STEP_BACK_BUTTON: `step-back-button-${uniqueId}`,
};

const Stepper: React.FC<Props> = ({ steps }) => {
  const [activeStep, setActiveStep] = useState(0);

  const goToNextStep = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const goToPreviousStep = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <MUIStepper activeStep={activeStep} orientation="vertical" data-testid={DATA_TEST_ID.CONTAINER}>
      {steps.map((step) => (
        <MUIStep key={step.id} data-testid={`${DATA_TEST_ID.STEP_CONTAINER}-${step.id}`}>
          <StepLabel
            optional={
              <Typography data-testid={`${DATA_TEST_ID.STEP_LABEL_SUBTITLE}-${step.id}`}>{step.subtitle}</Typography>
            }
          >
            <Typography data-testid={`${DATA_TEST_ID.STEP_LABEL}-${step.id}`} variant={"h6"}>
              {step.title}
            </Typography>
          </StepLabel>
          <StepContent
            TransitionProps={{
              unmountOnExit: false,
            }}
            data-testid={`${DATA_TEST_ID.STEP_CONTENT}-${step.id}`}
          >
            <Stack data-testid={`${DATA_TEST_ID.STEP_CONTENT_STACK}-${step.id}`}>
              {step.content}
              <Box sx={{ mt: 2, gap: 2 }}>
                {activeStep !== 0 && (
                  <Button
                    variant={"outlined"}
                    onClick={goToPreviousStep}
                    sx={{ borderRadius: (theme) => theme.tabiyaRounding.xl }}
                    disableElevation={true}
                    fullWidth={false}
                    data-testid={`${DATA_TEST_ID.STEP_BACK_BUTTON}-${step.id}`}
                  >
                    Back
                  </Button>
                )}
                {activeStep !== steps?.length - 1 && (
                  <Button
                    variant={"outlined"}
                    sx={{ borderRadius: (theme) => theme.tabiyaRounding.xl }}
                    onClick={goToNextStep}
                    disableElevation={true}
                    fullWidth={false}
                    data-testid={`${DATA_TEST_ID.STEP_NEXT_BUTTON}-${step.id}`}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Stack>
          </StepContent>
        </MUIStep>
      ))}
    </MUIStepper>
  );
};

export default Stepper;
