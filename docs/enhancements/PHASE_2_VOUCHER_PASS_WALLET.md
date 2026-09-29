# 🎟️ Phase 2: 電子票券與 QR Code 集中票夾 (Voucher & Pass Wallet)

> **狀態**：已完成 (Completed)  
> **前置需求**：[Phase 1: 本地圖片引擎與容量管理](file:///d:/Projects/travel-app/docs/enhancements/PHASE_1_STORAGE_AND_IMAGE_VAULT.md)  
> **核心目標**：在 `InfoPage` 打造統一的電子票夾保險箱，將散落相簿各處的 Visit Japan Web、機票 QR、Klook 門票、eSIM 截圖集中管理，支援離線存取與全螢幕高對比刷碼。

---

## 1. 痛點分析與出國情境 (Travel Scenarios)

* **情境 1：排隊過海關或登機口時手忙腳亂**
  - 旅人站在排隊隊伍中，在相簿上千張出遊照與戰利品照片中瘋狂上下滑動找 Visit Japan Web QR Code 或登機證截圖，後面人群緊盯，焦慮感爆表。
* **情境 2：機場弱網或無訊號**
  - 下飛機連不上機場免費 Wi-Fi，開不了雲端硬碟或航空公司 App 導致無法出示憑證。
* **情境 3：刷條碼機辨識不良**
  - 深色模式或螢幕太暗，條碼掃描槍掃不到。

---

## 2. 解決方案與功能亮點 (Key Features)

1. **雙重儲存模式（極致省空間）**：
   - **文字/URL 模式（0 KB 儲存）**：若票券僅是一組訂位代碼或 URL，前端利用輕量向量渲染直接繪製 QR Code，完全不佔用任何圖片容量！
   - **截圖/圖檔模式（超輕量 IndexedDB）**：若是複雜的 PDF 截圖或官方憑證，透過 Phase 1 Canvas 壓縮至 ~90KB 存入本地。
2. **全螢幕高亮刷碼模式（Scanner-Ready Modal）**：
   - 點擊票券即跳出全螢幕純白背景高對比畫面，條碼放大置中，自動防反光，確保掃描槍一秒識別。
3. **出國必備預設分類**：
   - 入境申報 (Visit Japan Web / Q-Code)、機票登機證、鐵路交通券、景點門票、飯店憑證、eSIM 開通碼。

---

## 3. 目標檔案矩陣 (Target File Matrix)

| 操作 | 檔案路徑 | 職責與說明 |
|:---|:---|:---|
| **新增** | `src/models/types/VoucherTypes.ts` | 票券資料模型定義（類別、有效日期、憑證代碼、圖檔ID關聯） |
| **新增** | `src/components/info/voucher/VoucherWalletSection.tsx` | 嵌入於 `InfoPage` 的毛玻璃票夾卡片清單 |
| **新增** | `src/components/info/voucher/VoucherCard.tsx` | 單張票券卡片（含類別徽章、代碼快捷複製、縮圖） |
| **新增** | `src/components/info/voucher/VoucherModal.tsx` | 新增/編輯票券表單（支援相機拍照、相簿選圖、文字轉 QR） |
| **新增** | `src/components/info/voucher/VoucherBarcodeViewerModal.tsx` | 全螢幕純白高對比刷碼彈窗 |
| **整合** | [`src/page/Book/InfoPage.tsx`](file:///d:/Projects/travel-app/src/page/Book/InfoPage.tsx) | 在航班與住宿旁整合 `VoucherWalletSection` |

---

## 4. 驗收標準 (Acceptance Criteria)

1. [x] 可新增一筆「Visit Japan Web 申報碼」，貼上網址自動生成清晰向量 QR 碼，無需上傳任何圖檔。
2. [x] 可新增一筆門票憑證，拍照上傳後圖片自動壓縮並存入本地 IndexedDB。
3. [x] 點擊卡片彈出全螢幕刷碼介面，在手機與電腦端均能完美置中展示。
4. [x] 拔除網路（進入飛航模式），重新整理頁面後，票夾依然能正常讀取與出示所有 QR 碼。
