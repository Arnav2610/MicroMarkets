import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

/**
 * App-wide layout dimensions as percentages of screen.
 * Use this instead of fixed pixel values for responsive layout.
 */
export function useLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const w = width;
    const h = height;
    return {
      // Horizontal: ~4.5% each side (consistent across all pages)
      paddingH: w * 0.045,
      // Vertical padding
      paddingV: h * 0.02,
      // Page header: consistent position/alignment
      headerPaddingTop: h * 0.02,
      headerPaddingBottom: h * 0.02,
      headerPaddingH: w * 0.045,
      // Section gaps
      gapSm: h * 0.01,
      gapMd: h * 0.02,
      gapLg: h * 0.03,
      // Content width: use full width (no maxWidth constraint)
      contentWidth: w,
      // Bottom nav height
      bottomNavH: Math.max(h * 0.08, 56),
      // Border radius
      radius: w * 0.02,
      // Input/button sizing
      inputPadding: w * 0.04,
      inputMinH: h * 0.08,
      btnPaddingV: h * 0.02,
      // Raw dimensions for custom use
      width: w,
      height: h,
    };
  }, [width, height]);
}
