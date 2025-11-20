
export interface LogoColorConfig {
  colorMain: string;
  colorMainRest: string;
  colorSecondary: string;
  colorTagline: string;
  bgColor: string;
}

export interface LogoConfig extends LogoColorConfig {
  textMain: string;
  textSecondary: string;
  textTagline: string;
  fontFamily: string;

  // First Letter (e.g. "D")
  fontSizeMainFirst: number;
  skewMainFirst: number;
  xOffsetMainFirst: number;

  // Rest of Name (e.g. "imo")
  fontSizeMainRest: number;
  skewMainRest: number;
  xOffsetMainRest: number;
  letterSpacingMainRest: number;

  // Symbol (e.g. "V")
  fontSizeSecondary: number;
  skewSecondary: number;
  xOffsetSecondary: number;

  // Tagline
  fontSizeTagline: number;
  taglineOffset: number;
  letterSpacingTagline: number;
  skewTagline: number;
}

export enum DownloadFormat {
  SVG = 'SVG',
  PNG = 'PNG',
}
