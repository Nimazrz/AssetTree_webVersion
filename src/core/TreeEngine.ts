/**
 * TreeEngine: Bottom-Up Financial Calculation & Integrity Engine
 * Recursively computes asset values, hierarchy percentages, cycle prevention,
 * brokerage Excel parsing, and anomaly detection.
 */

import {
  StoredNodeEntity,
  CalculatedNode,
  TreeHealth,
  SortConfig,
  RawBourseRow,
  ParsedImportRow,
  ImportPlan,
  SymbolEntryEntity,
  BourseAnomalyType,
  DuplicateResolution,
  AbsentTreeNode,
  ROOT_NODE_ID,
  ROOT_NODE_NAME,
} from '../types';

export interface CalculatedTreeResult {
  rootCalculated: CalculatedNode;
  calculatedMap: Map<string, CalculatedNode>;
  allCalculated: CalculatedNode[];
}

export const TreeEngine = {
  createDefaultRootNode(): StoredNodeEntity {
    return {
      id: ROOT_NODE_ID,
      parentId: null,
      name: ROOT_NODE_NAME,
      quantity: 1.0,
      unit: "سبد",
      unitPrice: 0.0,
      createdAt: Date.now(),
    };
  },

  generateNodeId(): string {
    const rand = Math.random().toString(36).substring(2, 10);
    return `node_${rand}_${Date.now()}`;
  },

  isRootNode(nodeId?: string | null, parentId?: string | null): boolean {
    return nodeId === ROOT_NODE_ID || parentId === null;
  },

  evaluateTree(nodes: StoredNodeEntity[]): CalculatedTreeResult {
    // Distinct by id
    const nodeMapById = new Map<string, StoredNodeEntity>();
    for (const n of nodes) {
      if (!nodeMapById.has(n.id)) {
        nodeMapById.set(n.id, n);
      }
    }
    const workingNodes = Array.from(nodeMapById.values());

    let root = workingNodes.find((it) => it.id === ROOT_NODE_ID) ||
      workingNodes.find((it) => it.parentId === null);

    if (!root) {
      root = this.createDefaultRootNode();
      workingNodes.unshift(root);
      nodeMapById.set(root.id, root);
    }

    const childrenByParentId = new Map<string, StoredNodeEntity[]>();
    for (const it of workingNodes) {
      if (it.parentId && it.id !== root.id) {
        const list = childrenByParentId.get(it.parentId) || [];
        list.push(it);
        childrenByParentId.set(it.parentId, list);
      }
    }

    const calculatedNodes = new Map<string, CalculatedNode>();

    const calculateNode = (
      node: StoredNodeEntity,
      depth: number,
      ancestors: Set<string>
    ): CalculatedNode => {
      const childEntities = (childrenByParentId.get(node.id) || []).filter(
        (c) => !ancestors.has(c.id)
      );

      const nextAncestors = new Set(ancestors);
      nextAncestors.add(node.id);

      const children = childEntities.map((c) =>
        calculateNode(c, depth + 1, nextAncestors)
      );

      const isGroup = children.length > 0;
      const totalValue = !isGroup
        ? node.quantity * node.unitPrice
        : children.reduce((sum, c) => sum + c.totalValue, 0);

      const calculated: CalculatedNode = {
        id: node.id,
        parentId: node.parentId,
        name: node.name,
        symbol: node.symbol,
        assetType: node.assetType,
        quantity: isGroup ? 1.0 : node.quantity,
        unit: node.unit,
        unitPrice: isGroup ? totalValue : node.unitPrice,
        totalValue,
        percentOfTotal: 0,
        percentOfGroup: 0,
        isGroup,
        children,
        depth,
        childCount: children.reduce((acc, c) => acc + 1 + c.childCount, 0),
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
        categoryTag: node.categoryTag,
      };

      calculatedNodes.set(node.id, calculated);
      return calculated;
    };

    const initialRoot = calculateNode(root, 0, new Set());

    const applyPercentages = (
      node: CalculatedNode,
      parentTotal: number,
      rootTotal: number
    ): CalculatedNode => {
      const isRoot = this.isRootNode(node.id, node.parentId);
      const percentOfTotal = isRoot
        ? 100.0
        : rootTotal > 0
        ? (node.totalValue / rootTotal) * 100.0
        : 0.0;
      const percentOfGroup = isRoot
        ? 100.0
        : parentTotal > 0
        ? (node.totalValue / parentTotal) * 100.0
        : 0.0;

      const updatedChildren = node.children.map((c) =>
        applyPercentages(c, node.totalValue, rootTotal)
      );

      const updatedNode: CalculatedNode = {
        ...node,
        percentOfTotal,
        percentOfGroup,
        children: updatedChildren,
      };

      calculatedNodes.set(updatedNode.id, updatedNode);
      return updatedNode;
    };

    const finalRoot = applyPercentages(
      initialRoot,
      initialRoot.totalValue,
      initialRoot.totalValue
    );
    const allCalculated = Array.from(calculatedNodes.values());

    return {
      rootCalculated: finalRoot,
      calculatedMap: calculatedNodes,
      allCalculated,
    };
  },

  checkCycle(
    nodes: StoredNodeEntity[],
    movingNodeId: string,
    newParentId: string | null
  ): boolean {
    if (movingNodeId === newParentId) return true;
    if (!newParentId || newParentId === ROOT_NODE_ID) return false;

    const nodeMap = new Map<string, StoredNodeEntity>(nodes.map((n) => [n.id, n]));
    let currentParentId: string | null | undefined = newParentId;

    while (currentParentId && currentParentId !== ROOT_NODE_ID) {
      if (currentParentId === movingNodeId) {
        return true; // Cycle detected
      }
      const parentNode = nodeMap.get(currentParentId);
      currentParentId = parentNode?.parentId;
    }

    return false;
  },

  calculateSmartDefaultQuantity(
    parentNode: CalculatedNode,
    newUnitPrice: Double = 0
  ): number {
    if (newUnitPrice <= 0) return 1.0;

    if (parentNode.children.length === 0) {
      if (parentNode.totalValue > 0) {
        const q = parentNode.totalValue / newUnitPrice;
        return Number.isInteger(q) ? q : Math.round(q * 100) / 100;
      }
      return 1.0;
    } else {
      const currentChildrenSum = parentNode.children.reduce(
        (acc, c) => acc + c.totalValue,
        0
      );
      const remainingValue = parentNode.totalValue - currentChildrenSum;
      if (remainingValue > 0) {
        const q = remainingValue / newUnitPrice;
        return Number.isInteger(q) ? q : Math.round(q * 100) / 100;
      }
      return 1.0;
    }
  },

  sortCalculatedTree(node: CalculatedNode, sortConfig: SortConfig): CalculatedNode {
    if (node.children.length === 0) return node;

    const sortedChildren = node.children.map((c) =>
      this.sortCalculatedTree(c, sortConfig)
    );

    sortedChildren.sort((a, b) => {
      let res = 0;
      switch (sortConfig.field) {
        case 'TOTAL_VALUE':
          res = a.totalValue - b.totalValue;
          break;
        case 'NAME':
          res = a.name.localeCompare(b.name, 'fa');
          break;
        case 'QUANTITY':
          res = a.quantity - b.quantity;
          break;
        case 'UNIT_PRICE':
          res = a.unitPrice - b.unitPrice;
          break;
        case 'PERCENT_OF_TOTAL':
          res = a.percentOfTotal - b.percentOfTotal;
          break;
        case 'PERCENT_OF_GROUP':
          res = a.percentOfGroup - b.percentOfGroup;
          break;
      }
      return sortConfig.direction === 'ASC' ? res : -res;
    });

    return { ...node, children: sortedChildren };
  },

  performTreeHealthCheck(rootCalculated: CalculatedNode): TreeHealth {
    const directChildrenSum = rootCalculated.children.reduce(
      (sum, c) => sum + c.totalValue,
      0
    );
    const discrepancy = Math.abs(rootCalculated.totalValue - directChildrenSum);
    const isValid = discrepancy < 0.1 || rootCalculated.children.length === 0;

    let totalNodeCount = 1;
    let zeroValueCount = rootCalculated.totalValue === 0 ? 1 : 0;

    const traverse = (n: CalculatedNode) => {
      for (const child of n.children) {
        totalNodeCount++;
        if (child.totalValue === 0) zeroValueCount++;
        traverse(child);
      }
    };
    traverse(rootCalculated);

    return {
      isValid,
      rootTotal: rootCalculated.totalValue,
      directChildrenSum,
      discrepancy,
      totalNodeCount,
      zeroValueCount,
    };
  },

  // --- Symbol Book & Market Tools ---

  cleanRawSymbol(rawSymbol: string): string {
    if (!rawSymbol) return '';
    let cleaned = rawSymbol
      .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '') // remove zero-width / bidirectional chars
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .trim()
      .replace(/^[«"'\(\[\{]+|[»"'\)\]\}]+$/g, '') // remove surrounding brackets/quotes
      .trim();

    // Strip explicit space prefixes like "صندوق ", "گواهی ", "اختیار "
    const explicitPrefixes = ['صندوق ', 'گواهی ', 'اختیار '];
    for (const pfx of explicitPrefixes) {
      if (cleaned.startsWith(pfx)) {
        cleaned = cleaned.substring(pfx.length).trim();
      }
    }

    // Option ticker e.g. "ضخود1200" or "طفول1402" (starts with ض or ط and ends with digits)
    if (/^[ضط][^\d\s]{2,}\d+$/.test(cleaned)) {
      cleaned = cleaned.substring(1).replace(/\d+$/, '').trim();
    }

    return cleaned;
  },

  lookupSymbolInBook(
    rawSymbol: string,
    symbolBook: SymbolEntryEntity[],
    companyNameHint?: string | null
  ): { canonicalName: string; industry: string; foundInBook: boolean } {
    const normalize = (s: string) =>
      s
        .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '')
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/[\s_\-]+/g, '')
        .toLowerCase()
        .trim();

    const trimmed = rawSymbol.trim();
    const normRaw = normalize(trimmed);

    // 1. Direct or normalized match on rawSymbol or canonicalName
    const exact = symbolBook.find(
      (it) =>
        normalize(it.rawSymbol) === normRaw ||
        normalize(it.canonicalName) === normRaw
    );
    if (exact) {
      return {
        canonicalName: exact.canonicalName,
        industry: exact.industry,
        foundInBook: true,
      };
    }

    // 2. Cleaned symbol match
    const cleaned = this.cleanRawSymbol(trimmed);
    const normClean = normalize(cleaned);
    const cleanMatch = symbolBook.find(
      (it) =>
        normalize(it.rawSymbol) === normClean ||
        normalize(it.canonicalName) === normClean
    );
    if (cleanMatch) {
      return {
        canonicalName: cleanMatch.canonicalName,
        industry: cleanMatch.industry,
        foundInBook: true,
      };
    }

    // 3. Right-of-share (حق تقدم): starts with "ح" + known base symbol e.g. "حفولاد" -> "فولاد"
    if (trimmed.startsWith('ح') && trimmed.length > 2) {
      const baseSymbol = trimmed.substring(1);
      const normBase = normalize(baseSymbol);
      const rightMatch = symbolBook.find(
        (it) => normalize(it.rawSymbol) === normBase
      );
      if (rightMatch) {
        return {
          canonicalName: `حق تقدم ${rightMatch.canonicalName}`,
          industry: rightMatch.industry,
          foundInBook: true,
        };
      }
    }

    // 4. Match against company name hint (from Excel "نام شرکت" column)
    if (companyNameHint && companyNameHint.trim()) {
      const normCompany = normalize(companyNameHint);
      const companyMatch = symbolBook.find(
        (it) =>
          normCompany.includes(normalize(it.canonicalName)) ||
          normalize(it.canonicalName).includes(normCompany) ||
          normCompany.includes(normalize(it.rawSymbol))
      );
      if (companyMatch) {
        return {
          canonicalName: companyMatch.canonicalName,
          industry: companyMatch.industry,
          foundInBook: true,
        };
      }
      return {
        canonicalName: companyNameHint.trim(),
        industry: "سایر صنایع",
        foundInBook: false,
      };
    }

    return {
      canonicalName: cleaned || trimmed,
      industry: "سایر صنایع",
      foundInBook: false,
    };
  },

  detectRowAnomaly(raw: RawBourseRow): [BourseAnomalyType, string] {
    if (raw.quantity > 0 && raw.totalRialValue === raw.quantity) {
      return [
        'TABEI_OPTION',
        'ارزش ریالی با تعداد برابر است (اوراق تبعی / اختیار ۱ ریالی)',
      ];
    }
    if (raw.quantity > 0 && raw.totalRialValue === 0) {
      return [
        'ZERO_VALUE',
        'ارزش کل صفر ریال است (نماد متوقف یا بدون قیمت پایانی)',
      ];
    }
    if (
      raw.totalRialValue > 0 &&
      raw.tradeableQuantity !== null &&
      raw.tradeableQuantity === 0 &&
      raw.quantity > 0
    ) {
      return [
        'PENDING_CAPITAL_INCREASE',
        'سهم غیرقابل معامله (حق تقدم / افزایش سرمایه در جریان)',
      ];
    }
    return ['STANDARD', 'اطلاعات سهم نرمال و آماده ورود است'];
  },

  buildImportPlan(
    rawRows: RawBourseRow[],
    currentStoredNodes: StoredNodeEntity[],
    calculatedTree: CalculatedNode,
    symbolBook: SymbolEntryEntity[]
  ): ImportPlan {
    const standardRows: ParsedImportRow[] = [];
    const needsReviewRows: ParsedImportRow[] = [];
    const duplicateRows: ParsedImportRow[] = [];
    const newSymbolsRows: ParsedImportRow[] = [];

    const existingNodeMapByName = new Map<string, StoredNodeEntity>();
    for (const it of currentStoredNodes) {
      if (it.parentId !== null) {
        existingNodeMapByName.set(it.name.trim().toLowerCase(), it);
      }
    }

    const processedNames = new Set<string>();

    rawRows.forEach((raw, index) => {
      const [anomalyType, anomalyDesc] = this.detectRowAnomaly(raw);
      const lookup = this.lookupSymbolInBook(raw.symbolRaw, symbolBook, raw.companyName);
      const unitPrice = raw.quantity > 0 ? raw.totalRialValue / raw.quantity : 0;

      const matchedExisting = existingNodeMapByName.get(lookup.canonicalName.toLowerCase());
      const isDuplicate = !!matchedExisting;

      const parsedRow: ParsedImportRow = {
        id: `import_row_${index}_${Date.now()}`,
        raw,
        canonicalName: lookup.canonicalName,
        industry: lookup.industry,
        unitPriceCalculated: unitPrice,
        anomalyType,
        anomalyDescription: anomalyDesc,
        isDuplicateInTree: isDuplicate,
        matchedExistingNodeId: matchedExisting?.id,
        matchedExistingNodeName: matchedExisting?.name,
        existingQuantity: matchedExisting?.quantity,
        existingUnitPrice: matchedExisting?.unitPrice,
        selected: anomalyType === 'STANDARD',
        duplicateResolution: isDuplicate
          ? (lookup.canonicalName === "سایر سهام" || raw.symbolRaw === "سایر سهام" ? 'SUM' : 'REPLACE')
          : 'REPLACE',
      };

      processedNames.add(lookup.canonicalName.toLowerCase());

      if (anomalyType === 'STANDARD') {
        standardRows.push(parsedRow);
      } else {
        needsReviewRows.push(parsedRow);
      }

      if (isDuplicate) {
        duplicateRows.push(parsedRow);
      } else {
        newSymbolsRows.push(parsedRow);
      }
    });

    const absentTreeNodes: AbsentTreeNode[] = [];
    const checkAbsents = (n: CalculatedNode) => {
      if (!n.isGroup && n.parentId !== null) {
        const clean = n.name.toLowerCase().trim();
        if (
          !processedNames.has(clean) &&
          (n.unit.includes("سهم") || n.unit.includes("واحد"))
        ) {
          absentTreeNodes.push({
            id: n.id,
            name: n.name,
            totalValue: n.totalValue,
          });
        }
      }
      for (const child of n.children) {
        checkAbsents(child);
      }
    };
    checkAbsents(calculatedTree);

    return {
      standardRows,
      needsReviewRows,
      duplicateRows,
      newSymbolsRows,
      absentTreeNodes,
    };
  },

  parsePastedTextToRows(
    text: string,
    minRialThreshold = 0,
    onlyTradeable = true,
    groupSmallAssets = true
  ): RawBourseRow[] {
    const lines = text
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return [];

    // Detect delimiter across first several lines
    let delimiter = '\t';
    let tabCount = 0;
    let commaCount = 0;
    let semiCount = 0;

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      if (lines[i].includes('\t')) tabCount++;
      if (lines[i].includes(',')) commaCount++;
      if (lines[i].includes(';')) semiCount++;
    }

    if (tabCount > 0) delimiter = '\t';
    else if (semiCount > 0) delimiter = ';';
    else if (commaCount > 0) delimiter = ',';
    else delimiter = ' ';

    // Split line respecting quotes if comma-delimited
    const splitLine = (l: string): string[] => {
      if (delimiter !== ',') {
        if (delimiter === ' ') {
          return l.split(/\s{2,}|\t/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
        }
        return l.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      }
      const parts: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < l.length; i++) {
        const c = l[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          parts.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += c;
        }
      }
      parts.push(current.trim().replace(/^["']|["']$/g, ''));
      return parts;
    };

    const toEnglishDigits = (str: string): string => {
      return str
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
    };

    const parseNum = (s?: string): number => {
      if (!s) return 0.0;
      const clean = toEnglishDigits(s)
        .replace(/,/g, '')
        .replace(/،/g, '')
        .replace(/\s+/g, '')
        .trim();
      const n = parseFloat(clean);
      return isNaN(n) ? 0.0 : n;
    };

    const cleanSymbolText = (s?: string): string => {
      if (!s) return '';
      return s
        .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '')
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/^[«"'\(\[\{]+|[»"'\)\]\}]+$/g, '')
        .trim();
    };

    const rows: RawBourseRow[] = [];
    let symbolCol = -1;
    let qtyCol = -1;
    let rialValCol = -1;
    let companyCol = -1;
    let assetTypeCol = -1;
    let statusCol = -1;
    let tradeableQtyCol = -1;
    let headerDetected = false;

    let otherAssetsTotalRial = 0.0;
    let otherAssetsTotalQty = 0.0;

    lines.forEach((line, idx) => {
      const parts = splitLine(line);
      if (parts.length === 0 || parts.every((p) => p.length === 0)) return;

      // Header line detection (matches user format: ردیف کد سهامداری نماد نام شرکت تعداد سهم میزان دارایی قابل معامله ارزش ریالی درصد از کل نوع دارایی کارگزار ناظر وضعیت)
      if (
        !headerDetected &&
        (line.includes("نماد") ||
          line.includes("سهام") ||
          line.includes("ارزش") ||
          line.includes("تعداد") ||
          line.includes("دارایی") ||
          line.includes("ردیف"))
      ) {
        headerDetected = true;
        parts.forEach((headerTitle, pIdx) => {
          const h = headerTitle.replace(/\s+/g, "");
          if (
            (h === "نماد" || (h.includes("نماد") && !h.includes("کد"))) &&
            symbolCol === -1
          ) {
            symbolCol = pIdx;
          }
          if (
            (h.includes("شرکت") || h.includes("نام") || h.includes("شرح")) &&
            companyCol === -1 &&
            !h.includes("نوع") &&
            !h.includes("نماد") &&
            !h.includes("کد")
          ) {
            companyCol = pIdx;
          }
          if (h.includes("نوع") && !h.includes("وضعیت") && assetTypeCol === -1) {
            assetTypeCol = pIdx;
          }
          if ((h.includes("وضعیت") || h.includes("وضع")) && statusCol === -1) {
            statusCol = pIdx;
          }
          // Column: میزان دارایی قابل معامله or تعداد قابل معامله
          if (
            (h.includes("قابل") || h.includes("معامله")) &&
            (h.includes("تعداد") || h.includes("میزان") || h.includes("دارایی") || h.includes("سهم")) &&
            tradeableQtyCol === -1
          ) {
            tradeableQtyCol = pIdx;
          }
          // Column: تعداد سهم (ensure not matching کد سهامداری or قابل معامله)
          if (
            (h.includes("تعداد") || h.includes("حجم") || h.includes("سهم")) &&
            !h.includes("قابل") &&
            !h.includes("معامله") &&
            !h.includes("کد") &&
            !h.includes("ارزش") &&
            qtyCol === -1
          ) {
            qtyCol = pIdx;
          }
          // Column: ارزش ریالی or مبلغ
          if (
            (h.includes("ارزش") || h.includes("مبلغ") || h.includes("خالص") || h.includes("قیمتکل")) &&
            rialValCol === -1
          ) {
            rialValCol = pIdx;
          }
        });
        return;
      }

      if (parts.length >= 2) {
        let symbol = cleanSymbolText(
          symbolCol >= 0 && symbolCol < parts.length ? parts[symbolCol] : parts[1] || parts[0]
        );

        // If symbol mistakenly caught a pure integer row number (e.g. "1"), find the real symbol column
        if (/^\d+$/.test(symbol)) {
          const candidate = parts.find((p) => p.length >= 2 && p.length <= 15 && !/^\d+$/.test(p) && !p.includes('140') && !p.includes('/'));
          if (candidate) symbol = cleanSymbolText(candidate);
        }

        const qty =
          qtyCol >= 0 && qtyCol < parts.length
            ? parseNum(parts[qtyCol])
            : parseNum(parts[3]);
        const rialVal =
          rialValCol >= 0 && rialValCol < parts.length
            ? parseNum(parts[rialValCol])
            : parseNum(parts[5]);
        const company =
          companyCol >= 0 && companyCol < parts.length
            ? parts[companyCol]?.trim()
            : parts[2] || null;
        const rawAssetType =
          assetTypeCol >= 0 && assetTypeCol < parts.length
            ? parts[assetTypeCol]?.trim()
            : "قابل معامله";
        const rawStatus =
          statusCol >= 0 && statusCol < parts.length
            ? parts[statusCol]?.trim()
            : "";
        const tradeableQty =
          tradeableQtyCol >= 0 && tradeableQtyCol < parts.length
            ? parseNum(parts[tradeableQtyCol])
            : null;

        // Tradeability filter (Vazife 11 fix):
        // Only discard if explicitly non-tradeable or locked. Allow "مجاز", "سهام", "صندوق", "عادی", "بورس", "فرابورس", etc.
        if (onlyTradeable) {
          const combinedTypeStatus = `${rawAssetType} ${rawStatus}`;
          const isExplicitlyNonTradeable =
            combinedTypeStatus.includes("غیرقابل") ||
            combinedTypeStatus.includes("غیر قابل") ||
            combinedTypeStatus.includes("مسدود") ||
            combinedTypeStatus.includes("بسته") ||
            combinedTypeStatus.includes("ممنوع-متوقف");

          if (isExplicitlyNonTradeable) {
            return;
          }

          // If tradeableQty is explicitly specified as 0 while total quantity is > 0 and status says non-tradeable
          if (tradeableQty !== null && tradeableQty <= 0 && qty > 0 && combinedTypeStatus.includes("غیر")) {
            return;
          }
        }

        const effectiveRial = rialVal > 0 ? rialVal : qty * 5000.0;
        if (minRialThreshold > 0.0 && effectiveRial <= minRialThreshold) {
          if (groupSmallAssets) {
            otherAssetsTotalRial += effectiveRial;
            otherAssetsTotalQty += qty;
          }
          return;
        }

        if (symbol && (qty > 0 || effectiveRial > 0)) {
          rows.push({
            symbolRaw: symbol,
            quantity: qty,
            totalRialValue: effectiveRial,
            companyName: company,
            assetType: rawAssetType,
            tradeableQuantity: tradeableQty,
            rawRowNumber: idx + 1,
          });
        }
      }
    });

    if (groupSmallAssets && otherAssetsTotalRial > 0.0) {
      rows.push({
        symbolRaw: "سایر سهام",
        quantity: otherAssetsTotalQty > 0 ? otherAssetsTotalQty : 1.0,
        totalRialValue: otherAssetsTotalRial,
        companyName: "سایر سهام تجمیع شده",
        assetType: "قابل معامله",
        tradeableQuantity: null,
        rawRowNumber: lines.length + 1,
      });
    }

    return rows;
  },

  getSampleBourseRows(): RawBourseRow[] {
    return [
      {
        symbolRaw: "فولاد",
        quantity: 45000.0,
        totalRialValue: 279000000.0,
        companyName: "فولاد مبارکه اصفهان",
        assetType: "سهم عادی",
        tradeableQuantity: 45000.0,
        rawRowNumber: 1,
      },
      {
        symbolRaw: "فملی",
        quantity: 30000.0,
        totalRialValue: 234000000.0,
        companyName: "ملی صنایع مس ایران",
        assetType: "سهم عادی",
        tradeableQuantity: 30000.0,
        rawRowNumber: 2,
      },
      {
        symbolRaw: "شپنا",
        quantity: 20000.0,
        totalRialValue: 96000000.0,
        companyName: "پالایش نفت اصفهان",
        assetType: "سهم عادی",
        tradeableQuantity: 20000.0,
        rawRowNumber: 3,
      },
      {
        symbolRaw: "خودرو",
        quantity: 60000.0,
        totalRialValue: 180000000.0,
        companyName: "ایران خودرو",
        assetType: "سهم عادی",
        tradeableQuantity: 60000.0,
        rawRowNumber: 4,
      },
      {
        symbolRaw: "وبملت",
        quantity: 80000.0,
        totalRialValue: 208000000.0,
        companyName: "بانک ملت",
        assetType: "سهم عادی",
        tradeableQuantity: 80000.0,
        rawRowNumber: 5,
      },
      {
        symbolRaw: "طلا",
        quantity: 25000.0,
        totalRialValue: 462500000.0,
        companyName: "صندوق طلای لوتوس",
        assetType: "صندوق سرمایه‌گذاری",
        tradeableQuantity: 25000.0,
        rawRowNumber: 6,
      },
      // Anomalies:
      {
        symbolRaw: "ضفولاد۸۰۲",
        quantity: 10000.0,
        totalRialValue: 10000.0,
        companyName: "اختیار خرید فولاد",
        assetType: "اختیار معامله",
        tradeableQuantity: 10000.0,
        rawRowNumber: 7,
      },
      {
        symbolRaw: "حفملی",
        quantity: 15000.0,
        totalRialValue: 90000000.0,
        companyName: "حق تقدم فملی",
        assetType: "حق تقدم",
        tradeableQuantity: 0.0,
        rawRowNumber: 8,
      },
      {
        symbolRaw: "شتران",
        quantity: 0.0,
        totalRialValue: 0.0,
        companyName: "پالایش نفت تهران",
        assetType: "سهم عادی",
        tradeableQuantity: 0.0,
        rawRowNumber: 9,
      },
    ];
  },

  groupAssetsByType(rootCalculated: CalculatedNode): {
    assetType: string;
    totalValue: number;
    percentOfTotal: number;
    count: number;
    nodes: CalculatedNode[];
  }[] {
    const map = new Map<string, { totalValue: number; nodes: CalculatedNode[] }>();
    const traverse = (node: CalculatedNode) => {
      if (!node.isGroup && node.depth > 0) {
        const typeKey = (node.assetType && node.assetType.trim()) || 'سایر / نامشخص';
        const existing = map.get(typeKey) || { totalValue: 0, nodes: [] };
        existing.totalValue += node.totalValue;
        existing.nodes.push(node);
        map.set(typeKey, existing);
      }
      node.children.forEach(traverse);
    };
    traverse(rootCalculated);

    const rootTotal = rootCalculated.totalValue > 0 ? rootCalculated.totalValue : 1;
    const result: {
      assetType: string;
      totalValue: number;
      percentOfTotal: number;
      count: number;
      nodes: CalculatedNode[];
    }[] = [];

    map.forEach((val, key) => {
      result.push({
        assetType: key,
        totalValue: val.totalValue,
        percentOfTotal: (val.totalValue / rootTotal) * 100,
        count: val.nodes.length,
        nodes: val.nodes,
      });
    });

    return result.sort((a, b) => b.totalValue - a.totalValue);
  },
};

type Double = number;
