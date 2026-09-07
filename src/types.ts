/**
 * Core Type Definitions & Interfaces for AssetTree
 * Defines stored nodes, calculated hierarchy metrics, settings, symbols, and undo snapshots.
 */

export const ROOT_NODE_ID = "root";
export const ROOT_NODE_NAME = "پرتفوی جامع دارایی‌ها";

export interface StoredNodeEntity {
  id: string;
  parentId: string | null;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  createdAt: number;
  updatedAt?: number | null;
  categoryTag?: string | null;
}

export interface SymbolEntryEntity {
  rawSymbol: string;
  canonicalName: string;
  industry: string;
  source: string; // 'MANUAL' | 'TSETMC' | 'COMPANY_NAME'
  lastUpdated: number;
  assetType: string;
}

export interface UndoSnapshot {
  id: string;
  title: string;
  timestamp: number;
  nodeCount: number;
  nodes: StoredNodeEntity[];
}

export interface CalculatedNode {
  id: string;
  parentId: string | null;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  percentOfTotal: number;
  percentOfGroup: number;
  isGroup: boolean;
  children: CalculatedNode[];
  depth: number;
  childCount: number;
  createdAt: number;
  updatedAt?: number | null;
  categoryTag?: string | null;
}

export type CurrencyUnit = 'TOMAN' | 'RIAL';

export type ThemeMode = 'SYSTEM' | 'DARK' | 'LIGHT';

export type AppFontSize = 'SMALL' | 'STANDARD' | 'LARGE' | 'EXTRA_LARGE';

export type AppLanguage = 'fa' | 'en';

export type AppViewMode =
  | 'TREEMAP'
  | 'CLASSIC_TREE'
  | 'TREE'
  | 'CHART'
  | 'BAR_CHART'
  | 'PIE_CHART'
  | 'ANALYTICS';

export interface DisplaySettings {
  showPercentOfTotal: boolean;
  showPercentOfGroup: boolean;
  showTotalValue: boolean;
  decimalPlaces: number;
  compactCurrency: boolean;
  currencyUnit: CurrencyUnit;
  usePersianDigits: boolean;
  themeMode: ThemeMode;
  privacyMode: boolean;
  fontSize: AppFontSize;
  language: AppLanguage;
  customAppColor: string;
  customViewOrder: AppViewMode[];
  customAssetColors: Record<string, string>;
}

export type SortField =
  | 'TOTAL_VALUE'
  | 'NAME'
  | 'QUANTITY'
  | 'UNIT_PRICE'
  | 'PERCENT_OF_TOTAL'
  | 'PERCENT_OF_GROUP';

export type SortDirection = 'ASC' | 'DESC';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export type BourseAnomalyType =
  | 'STANDARD'
  | 'TABEI_OPTION'
  | 'ZERO_VALUE'
  | 'PENDING_CAPITAL_INCREASE';

export interface RawBourseRow {
  symbolRaw: string;
  quantity: number;
  totalRialValue: number;
  companyName?: string | null;
  assetType?: string | null;
  tradeableQuantity?: number | null;
  broker?: string | null;
  status?: string | null;
  rawRowNumber: number;
}

export type DuplicateResolution = 'REPLACE' | 'SUM' | 'NEW_NODE_WITH_TAG' | 'SKIP';

export interface ParsedImportRow {
  id: string;
  raw: RawBourseRow;
  canonicalName: string;
  industry: string;
  unitPriceCalculated: number;
  anomalyType: BourseAnomalyType;
  anomalyDescription: string;
  isDuplicateInTree: boolean;
  matchedExistingNodeId?: string | null;
  matchedExistingNodeName?: string | null;
  existingQuantity?: number | null;
  existingUnitPrice?: number | null;
  selected: boolean;
  duplicateResolution: DuplicateResolution;
  customCategoryTag?: string | null;
}

export interface AbsentTreeNode {
  id: string;
  name: string;
  totalValue: number;
  industryName?: string | null;
}

export interface ImportPlan {
  standardRows: ParsedImportRow[];
  needsReviewRows: ParsedImportRow[];
  duplicateRows: ParsedImportRow[];
  newSymbolsRows: ParsedImportRow[];
  absentTreeNodes: AbsentTreeNode[];
}

export interface TreeHealth {
  isValid: boolean;
  rootTotal: number;
  directChildrenSum: number;
  discrepancy: number;
  totalNodeCount: number;
  zeroValueCount: number;
}

export interface AssetTemplateItem {
  id: string;
  name: string;
  unit: string;
  isCustom?: boolean;
}
