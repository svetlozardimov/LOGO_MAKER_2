
import React, { forwardRef } from 'react';
import { LogoConfig } from '../types';

interface LogoRendererProps {
  config: LogoConfig;
  width?: number;
  height?: number;
  className?: string;
}

export const LogoRenderer = forwardRef<SVGSVGElement, LogoRendererProps>(
  ({ config, width = 800, height = 400, className }, ref) => {
    const {
      textMain,
      textSecondary,
      textTagline,
      colorMain,
      colorMainRest,
      colorSecondary,
      colorTagline,
      bgColor,
      fontFamily,
      
      // First Letter
      fontSizeMainFirst,
      skewMainFirst,
      xOffsetMainFirst,

      // Rest of Name
      fontSizeMainRest,
      skewMainRest,
      xOffsetMainRest,
      letterSpacingMainRest,

      // Symbol
      fontSizeSecondary,
      skewSecondary,
      xOffsetSecondary,

      // Tagline
      fontSizeTagline,
      taglineOffset,
      letterSpacingTagline,
      skewTagline,
    } = config;

    // Layout Calculations
    const viewBoxWidth = 400;
    const viewBoxHeight = 200;
    const centerX = viewBoxWidth / 2;
    const centerY = viewBoxHeight / 2;

    const mainFirstChar = textMain.charAt(0);
    const mainRest = textMain.slice(1);

    // Helper for transform strings
    const getTransform = (x: number, skew: number) => {
        // Translate X, Center Y (approx), then Skew
        return `translate(${x}, 0) skewX(${skew})`;
    };

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        width={width}
        height={height}
        className={className}
        style={{ backgroundColor: bgColor }}
        aria-label={`${textMain} ${textSecondary} ${textTagline} Logo`}
      >
        {/* Background */}
        <rect width="100%" height="100%" fill={bgColor} />

        {/* Main Logo Group (Centered at viewport center) */}
        <g transform={`translate(${centerX}, ${centerY - 15})`}>
          
          {/* 1. First Letter (D) */}
          <text
            transform={getTransform(xOffsetMainFirst, skewMainFirst)}
            fill={colorMain}
            fontFamily={fontFamily}
            fontWeight="900"
            fontSize={fontSizeMainFirst}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {mainFirstChar}
          </text>

          {/* 2. Rest of Name (imo) */}
          <text
            transform={getTransform(xOffsetMainRest, skewMainRest)}
            fill={colorMainRest}
            fontFamily={fontFamily}
            fontWeight="900"
            fontSize={fontSizeMainRest}
            textAnchor="middle"
            dominantBaseline="middle"
            letterSpacing={`${letterSpacingMainRest}em`}
          >
            {mainRest}
          </text>

          {/* 3. Symbol (V) */}
          <text
             transform={getTransform(xOffsetSecondary, skewSecondary)}
             fill={colorSecondary}
             fontFamily={fontFamily}
             fontWeight="900"
             fontSize={fontSizeSecondary}
             textAnchor="middle"
             dominantBaseline="middle"
          >
            {textSecondary}
          </text>
        </g>

        {/* Tagline */}
        <text
          x={centerX}
          y={centerY + taglineOffset}
          transform={`rotate(0 ${centerX} ${centerY + taglineOffset}) skewX(${skewTagline})`}
          fill={colorTagline}
          fontFamily={fontFamily}
          fontWeight="bold"
          fontSize={fontSizeTagline}
          letterSpacing={`${letterSpacingTagline}em`}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {textTagline}
        </text>
      </svg>
    );
  }
);

LogoRenderer.displayName = 'LogoRenderer';
