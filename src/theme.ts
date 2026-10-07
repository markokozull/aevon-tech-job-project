import { alpha, createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    secondary: { main: '#475569' },
    success: { main: '#16a34a' },
    warning: { main: '#d97706' },
    error: { main: '#dc2626' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b' },
    divider: '#e2e8f0',
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          padding: '8px 16px',
          transition: 'background-color 150ms, border-color 150ms, box-shadow 150ms',
          '&:focus-visible': {
            outline: 'none',
          },
        },
        sizeSmall: { padding: '4px 12px' },
        sizeLarge: { padding: '10px 22px' },
        contained: ({ theme }) => ({
          '&:focus-visible': {
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.35)}`,
          },
        }),
        outlined: ({ theme }) => ({
          borderColor: theme.palette.divider,
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.background.paper,
          '&:hover': {
            borderColor: theme.palette.text.secondary,
            backgroundColor: theme.palette.background.default,
          },
          '&:focus-visible': {
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.25)}`,
          },
        }),
        text: ({ theme }) => ({
          '&:focus-visible': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
        }),
      },
    },
  },
})

export default theme
