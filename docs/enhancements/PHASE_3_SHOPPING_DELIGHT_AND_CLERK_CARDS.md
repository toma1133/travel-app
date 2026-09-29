# 🛍️ Phase 3: 購物體驗升級與店員對話小卡 (Shopping Delight & Clerk Phrases)

> **狀態**：已完成 (Completed)  
> **核心目標**：解決藥妝店/百貨採購時頻繁切換計算機 App、溝通語言障礙與結帳手忙腳亂的問題。

---

## 1. 痛點分析與實體情境 (Shopping Scenarios)

* **情境 1：算匯率像打仗**
  - 在日本驚安殿堂唐吉訶德，手上抓著 5 樣商品，一直在 iOS 計算機與購物清單之間來回切換計算含稅折合台幣多少錢。
* **情境 2：結帳溝通卡關**
  - 不會講日文或韓文，想問店員「請問可以免稅嗎？」、「請給我大一點的袋子」或「這個有沒有新的庫存」，只能手忙腳亂開 Google 翻譯。
* **情境 3：差一點點滿免稅門檻沒感知**
  - 目前的免稅條缺少達成時的驚喜與儀式感，使用者需要一直盯著數字算還差多少。

---

## 2. 解決方案與功能亮點 (Key Features)

1. **懸浮即時匯率換算器 (Floating Currency Converter)**：
   - 購物頁右下角懸浮按鈕，單手點擊立即展開極簡小計算機。
   - 輸入原幣金額（如 `3,500 JPY`），立即顯示台幣折合（`NT$ 735`）。
   - 附帶「**＋加入購物清單**」快捷鍵，直接把算好的金額帶入新增商品彈窗！
2. **出國結帳對話速查庫 (Clerk Phrases Pocketbook)**：
   - 整合進 `ClerkShowModal` 或獨立快捷按鈕，收錄常用出國結帳句型：
     - 💳 **免稅結帳**：「請問可以辦理免稅嗎？」、「請幫我分開結帳」
     - 🛍️ **包裝袋子**：「請給我一個大袋子」、「不需要塑膠袋」
     - 📦 **庫存規格**：「請問這個有未開封的全新庫存嗎？」、「請問有其他顏色/尺寸嗎？」
     - 🧾 **發票憑證**：「請給我明細收據」
   - 支援 **日語、韓語、英語、泰語** 大字卡全螢幕出示，並可點擊語音朗讀（結合既有 `SpeechLanguageUtil`）。
3. **免稅門檻達成慶祝動效 (Celebratory Feedback)**：
   - 當商品累計總額突破該店免稅門檻（例如 5,000 日圓），觸發彩色紙花特效（Confetti）與金色光暈呼吸燈，並在手機端觸發微震動（Haptic Vibration）。

---

## 3. 目標檔案矩陣 (Target File Matrix)

| 操作 | 檔案路徑 | 職責與說明 |
|:---|:---|:---|
| **新增** | `src/constants/ClerkPhrases.ts` | 日/韓/英/泰/中常用購物結帳對話語料庫 |
| **新增** | `src/components/shopping/FloatingCurrencyConverter.tsx` | 懸浮毛玻璃極速換算小計算機與稅金試算 |
| **新增** | `src/components/shopping/ClerkPhraseModal.tsx` | 店員大字對話速查卡（支援大字與發音朗讀） |
| **新增** | `src/components/shopping/TaxFreeCelebration.tsx` | 免稅達成彩帶特效與觸覺震動微互動 |
| **整合** | [`src/page/Book/ShoppingPage.tsx`](file:///d:/Projects/travel-app/src/page/Book/ShoppingPage.tsx) | 引入懸浮計算機、對話速查入口與慶祝監聽 |
| **整合** | [`src/components/shopping/ClerkShowModal.tsx`](file:///d:/Projects/travel-app/src/components/shopping/ClerkShowModal.tsx) | 加入「常用句子速切分頁」標籤與大字出示 |

---

## 4. 驗收標準 (Acceptance Criteria)

1. [x] 在購物頁點擊懸浮計算機，輸入數字能即時換算為本幣，點擊「加到清單」能預填金額至商品編輯框。
2. [x] 開啟店員對話小卡，點擊「請問可以免稅嗎？」，畫面全螢幕以極大字體顯示日文/韓文/英文，點擊語音按鈕能朗讀。
3. [x] 勾選或修改商品金額使總計跨過免稅門檻時，即刻觸發彩帶動畫與觸覺微震動。
