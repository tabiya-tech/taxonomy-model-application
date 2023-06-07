import type {Meta, StoryObj} from '@storybook/react';
import SnackbarProvider, {useSnackbar, VariantType} from './SnackbarProvider';
import {Button} from '@mui/material';

const meta: Meta<typeof SnackbarProvider> = {
  title: 'Components/SnackBar',
  component: SnackbarProvider,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof SnackbarProvider>;

type Color = 'success' | 'error' | 'warning';

interface ButtonConfig {
  color: Color;
  message: string;
  variant: VariantType;
}

const TestButton = () => {
  const {enqueueSnackbar} = useSnackbar();

  const buttons: ButtonConfig[] = [
    {color: 'success', message: 'Success message', variant: 'success'},
    {color: 'error', message: 'Failed message', variant: 'error'},
    {color: 'warning', message: 'Warning message', variant: 'warning'},
  ];

  const handleSnackbar = (message: string, variant: VariantType) => {
    enqueueSnackbar(message, {variant});
  };

  return (
    <>
      {buttons.map((button: ButtonConfig, index: number) => (
        <Button
          key={index}
          color={button.color}
          onClick={() => handleSnackbar(button.message, button.variant)}
          style={{textTransform: 'uppercase'}}
        >
          {button.variant}
        </Button>
      ))}
    </>
  );
};
export const Shown: Story = {
  render: () => (
    <SnackbarProvider>
      <TestButton/>
    </SnackbarProvider>
  ),
};
