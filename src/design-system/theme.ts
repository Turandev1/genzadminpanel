import { createTheme } from '@mui/material/styles'

const shared = {
  typography: {
    fontFamily: 'Inter, "SF Pro Display", "Segoe UI", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 760, letterSpacing: '-0.04em' },
    h2: { fontSize: '1.4rem', fontWeight: 740, letterSpacing: '-0.025em' },
    h3: { fontSize: '1.05rem', fontWeight: 700 },
    button: { textTransform: 'none' as const, fontWeight: 680, letterSpacing: '-0.01em' },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: { styleOverrides: { root: { minHeight: 42, boxShadow: 'none', borderRadius: 12 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: { styleOverrides: { root: { border: '1px solid', boxShadow: '0 18px 55px rgba(17, 24, 39, .06)' } } },
    MuiTableCell: { styleOverrides: { root: { borderBottomWidth: 1, paddingTop: 14, paddingBottom: 14 }, head: { fontSize: 11, fontWeight: 750, letterSpacing: '.07em', textTransform: 'uppercase' as const } } },
    MuiTextField: { defaultProps: { variant: 'outlined' as const, size: 'small' as const } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 11 } } },
  },
}

export const appTheme = createTheme({
  ...shared,
  palette: {
    mode: 'light', primary: { main: '#111827', contrastText: '#FFFFFF' }, secondary: { main: '#C8F169', contrastText: '#111827' },
    background: { default: '#F6F7F4', paper: '#FFFFFF' }, text: { primary: '#111827', secondary: '#667085' },
    divider: '#E4E7EC', success: { main: '#138A63' }, warning: { main: '#B76E19' }, error: { main: '#C43D58' }, info: { main: '#237AA5' },
  },
})

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: 'dark', primary: { main: '#F5F7F0', contrastText: '#111827' }, secondary: { main: '#C8F169', contrastText: '#111827' },
    background: { default: '#0B0F17', paper: '#151B26' }, text: { primary: '#F5F7F0', secondary: '#A7AFBE' },
    divider: '#293140', success: { main: '#70D7AE' }, warning: { main: '#F1BB6A' }, error: { main: '#FF8298' }, info: { main: '#7BCBF0' },
  },
})
