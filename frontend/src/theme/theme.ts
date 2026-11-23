import type { ThemeConfig } from 'antd';
import { colors } from './colors.ts';

export const antdTheme: ThemeConfig = {
  token: {
    // Primary brand colors
    colorPrimary: colors.peachFuzz[500],
    colorPrimaryHover: colors.peachFuzz[400],
    colorPrimaryActive: colors.peachFuzz[600],

    // Primary backgrounds and borders (light shades)
    colorPrimaryBg: colors.peachFuzz[50],
    colorPrimaryBgHover: colors.peachFuzz[100],
    colorPrimaryBorder: colors.peachFuzz[200],
    colorPrimaryBorderHover: colors.peachFuzz[300],
    colorPrimaryTextHover: colors.peachFuzz[400],
    colorPrimaryText: colors.peachFuzz[500],
    colorPrimaryTextActive: colors.peachFuzz[600],

    // Neutral text colors (Dim Grey)
    colorText: colors.dimGrey[900],
    colorTextSecondary: colors.dimGrey[700],
    colorTextTertiary: colors.dimGrey[500],
    colorTextQuaternary: colors.dimGrey[400],

    // Neutral borders and dividers (Dim Grey)
    colorBorder: colors.dimGrey[200],
    colorBorderSecondary: colors.dimGrey[100],

    // Neutral fills (Dim Grey)
    colorFill: colors.dimGrey[200],
    colorFillSecondary: colors.dimGrey[100],
    colorFillTertiary: colors.dimGrey[50],
    colorFillQuaternary: colors.dimGrey[50],

    // Layout and container backgrounds (light palette shades)
    colorBgLayout: colors.dimGrey[50],
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgSpotlight: colors.dimGrey[900],
  },
};
