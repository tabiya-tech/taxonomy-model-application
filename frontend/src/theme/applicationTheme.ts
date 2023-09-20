import {createTheme} from '@mui/material/styles';

const applicationTheme = createTheme({
  palette: {
    primary: {
      main: '#002147'
},
    secondary: {
      main: '#EEFF41',
    },
    text: {
      primary: '#002147'
    }
  },
  typography: {
    htmlFontSize: 16, // Set the base font size
    fontFamily: 'Inter, sans-serif', // Set the desired font family
    fontSize: 16, // Set the base font size
    // Define additional typography styles if needed
  },
  components: {
    MuiFormLabel: {
      styleOverrides: {
        asterisk: {
          color: "red",
        }
      },
    },
    MuiInput: {
      styleOverrides: {
        input: {
          fontSize: "1rem",
          "::placeholder": {
            color: "gray",
          }
        }
      }
    },
    MuiButton: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
        }
      }
    },
    MuiTableHead: {
      defaultProps: {
        style: {
          background: "#dedede"
        }
      }
    }
  }
});

export default applicationTheme;