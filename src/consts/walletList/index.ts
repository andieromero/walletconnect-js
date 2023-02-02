import { extensionFigure, extensionProvenance } from './extension';
import {
  mobileFigure,
  mobileFigureTest,
  mobileProvenance,
  mobileProvenanceTest,
} from './mobile';
import { webFigure, webFigureTest, webFigureConnectPage } from './web';

export const WALLET_LIST = [
  extensionFigure,
  extensionProvenance,
  mobileFigure,
  mobileFigureTest,
  mobileProvenance,
  mobileProvenanceTest,
  webFigure,
  webFigureTest,
  webFigureConnectPage,
];
