# 💎 Phase 0: Design System & Liquid Glass 基礎建設

> **狀態**：待執行 (Pending)  
> **前置需求**：無  
> **核心任務**：建立全站統一的 Liquid Glass（液態水滴毛玻璃）設計語言、Tokens 與高頻通用原子元件。

---

## 1. 現況分析與痛點 (Current State & Pain Points)

- **現狀**：
  - `src/index.css` 僅有初級的 `.glass-panel` 與 `.glass-pill`，樣式過於單薄且未廣泛落地。
  - 元件樣式分散在各個檔案中，大量直接寫死 `bg-card`、`bg-rose-600`、`border-border/70`，缺乏層次感與深度。
  - 暗色模式（Dark mode）與亮色模式（Light mode）邊界對比度不協調，缺乏現代作業系統（如 iOS 18 / macOS Sonoma）的液態高光與多重景深。
- **目標**：
  - 打造現代極致美學的 **Liquid Glass Design System**：
    - 多層次玻璃反射（Specular Highlight & Inset Border）
    - 飽和動態背景模糊（Backdrop Blur with Saturation Boost）
    - 浮動陰影（Elevated Ambient Shadow）
    - 靈動觸感微動畫（Elastic Transitions & Micro-interactions）

---

## 2. 技術規格與設計代碼規範 (Technical Specifications)

### 2.1 CSS 變數與 Tailwind 4 樣式擴充 (`src/index.css`)

```css
/* Liquid Glass Tokens */
:root {
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-bg-subtle: rgba(255, 255, 255, 0.45);
  --glass-bg-elevated: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(255, 255, 255, 0.65);
  --glass-border-subtle: rgba(255, 255, 255, 0.35);
  --glass-shadow: 0 12px 36px 0 rgba(0, 0, 0, 0.06), 0 4px 12px 0 rgba(0, 0, 0, 0.03);
  --glass-shadow-lg: 0 20px 48px -4px rgba(0, 0, 0, 0.12), 0 8px 16px -2px rgba(0, 0, 0, 0.04);
  --glass-specular: inset 0 1px 1px 0 rgba(255, 255, 255, 0.9);
}

.dark {
  --glass-bg: rgba(24, 24, 28, 0.68);
  --glass-bg-subtle: rgba(30, 30, 36, 0.45);
  --glass-bg-elevated: rgba(36, 36, 44, 0.82);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-border-subtle: rgba(255, 255, 255, 0.06);
  --glass-shadow: 0 14px 40px 0 rgba(0, 0, 0, 0.45), 0 4px 14px 0 rgba(0, 0, 0, 0.3);
  --glass-shadow-lg: 0 24px 56px -6px rgba(0, 0, 0, 0.6), 0 10px 20px -2px rgba(0, 0, 0, 0.4);
  --glass-specular: inset 0 1px 1px 0 rgba(255, 255, 255, 0.12);
}
```

### 2.2 核心原子元件庫清單 (`src/components/ui/`)

本階段將在 `src/components/ui/` 建立以下具備 Liquid Glass 特色的輕量原子元件：
1. **`GlassCard`**：基礎卡片容器，支援 `subtle`、`standard`、`elevated` 三種玻璃厚度與 Hover 光澤浮起效果。
2. **`GlassModal`**：現代彈窗骨架，包含背景模糊遮罩、滑入彈性動畫、毛玻璃頂欄與黏性按鈕底欄。
3. **`GlassButton`**：觸控按鈕，支援 `primary` (微漸變光彩)、`secondary` (通透玻璃)、`ghost`、`danger`，自帶 active 彈性下壓微反饋。
4. **`GlassBadge`**：圓角膠囊標籤，用於分類、標籤、狀態顯示，具備微光邊框與輕透明色調。
5. **`GlassSegmentedControl`**：iOS 風格滑動分段選擇器（用於切換檢視模式、天數、標籤分頁）。
6. **`GlassInput` / `GlassSelect`**：現代輸入框，聚焦時有微發光環（Glow Ring）與柔和反光。

---

## 3. 目標檔案矩陣 (Target File Matrix)

| 操作 | 檔案路徑 | 說明 |
|:---|:---|:---|
| **修改** | [`src/index.css`](file:///d:/Projects/travel-app/src/index.css) | 擴充 Liquid Glass 變數、通用工具類別、平滑滾動與觸覺動畫樣式 |
| **新增** | `src/components/ui/GlassCard.tsx` | 毛玻璃卡片基底 |
| **新增** | `src/components/ui/GlassModal.tsx` | 彈窗標準骨架（Compound Pattern） |
| **新增** | `src/components/ui/GlassButton.tsx` | 毛玻璃互動按鈕 |
| **新增** | `src/components/ui/GlassBadge.tsx` | 膠囊標籤元件 |
| **新增** | `src/components/ui/GlassSegmentedControl.tsx` | 滑動分段切換器 |
| **新增** | `src/components/ui/GlassInput.tsx` | 表單輸入與下拉元件 |
| **新增** | `src/components/ui/index.ts` | 統整匯出入口 |

---

## 4. 執行用 Prompt (Execution Prompt)

> 複製以下 Prompt 給 AI 即可啟動 Phase 0 執行：

```markdown
請依照 [PHASE_0_DESIGN_SYSTEM_AND_LIQUID_GLASS.md](file:///d:/Projects/travel-app/docs/refactor/PHASE_0_DESIGN_SYSTEM_AND_LIQUID_GLASS.md) 規格執行 Phase 0:

【任務目標】
為旅遊規劃 App 建立以 Liquid Glass (液態水滴毛玻璃) 為核心的現代 UI 設計系統與基礎 UI 元件庫。

【具體工作項目】
1. 編輯 `src/index.css`:
   - 擴充全套 Liquid Glass 變數 (包含亮色/暗色之 glass-bg, glass-border, glass-shadow, glass-specular 等)。
   - 增加常用 utility classes (如 `.liquid-glass`, `.liquid-glass-elevated`, `.liquid-glass-pill`)。
   - 保留原有的 Leaflet 與列印 (Print) 規則。
2. 建立目錄 `src/components/ui/` 並實作下列元件:
   - `GlassCard.tsx`: 具備 variant (subtle, standard, elevated)、hover 浮動微動畫、流體反光邊框。
   - `GlassModal.tsx`: Compound pattern (GlassModal.Header, Body, Footer)，整合 backdrop-blur-md 遮罩、ESC 鍵退出、防止滾動穿透、流暢進出場動畫。
   - `GlassButton.tsx`: 支援 primary, secondary, ghost, danger 變體與 loading 狀態圖示，具備 active 觸覺彈性縮放 (scale-98)。
   - `GlassBadge.tsx`: 靈動標籤元件，支援多種色彩語意 (emerald, sky, amber, rose, purple 等)。
   - `GlassSegmentedControl.tsx`: 平滑切換的分段選擇器，包含選取背景滑動效果。
   - `GlassInput.tsx`: 質感輸入框，包含 focus 光暈與無縫深淺色適配。
   - `index.ts`: 統一匯出所有 UI 元件。
3. 驗證:
   - 執行 `npm run build` 確認 TypeScript 型別無錯誤且無未使用之變數。
```

---

## 5. 驗收標準 (Acceptance Criteria)

- [ ] `npm run build` 順利通過，無任何 TypeScript 編譯錯誤或 lint 警告。
- [ ] 支援亮色與暗色模式無縫切換，毛玻璃在淺色底與深色底上文字對比均符合 WCAG AA 規範。
- [ ] 支援桌面與行動裝置（包括 iOS Safari `-webkit-backdrop-filter` 相容性）。
- [ ] 列印模式（`@media print`）下毛玻璃能自動平整化為清晰白底黑字。

---

## 6. 交接文件給 Phase 1 (Handover to Phase 1)

### 產出清單：
- 完整 Liquid Glass 樣式規則：定義在 `src/index.css`。
- 可直接引用的 UI 元件清單：`import { GlassCard, GlassModal, GlassButton, GlassBadge, GlassSegmentedControl, GlassInput } from '@/components/ui'`。

### Phase 1 須知：
- Phase 1 將重點放在**資料層架構整平與 React Query 快取優化**，請確保在此階段不改動 UI 表現，僅解耦資料存取與清理型別，為 Phase 2 替換 Glass 元件打好資料流基底。
