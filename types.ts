
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
  letterSpacingMain: number;
  letterSpacingTagline: number;
  gapSize: number;
}

export enum DownloadFormat {
  SVG = 'SVG',
  PNG = 'PNG',
}
