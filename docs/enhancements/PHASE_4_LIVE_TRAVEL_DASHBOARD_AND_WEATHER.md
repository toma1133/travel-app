# ☀️ Phase 4: 行程 Live 焦點卡與即時天氣預報 (Live Travel Dashboard & Weather)

> **狀態**：規劃中 (Ready for Implementation)  
> **核心目標**：解決旅人在路上「不知道當下該去哪」與「無法預知降雨準備雨具備案」的困擾。

---

## 1. 痛點分析與實體情境 (On-the-road Scenarios)

* **情境 1：從地鐵站走出來，不知道下一站要往哪走**
  - 旅人剛走出新宿車站出口，手機打開 App 還停留在幾天前的編輯畫面，需要在 Day 1 ~ Day 5 之間切換並在時間軸長長列表中尋找現在 14:30 到底是什麼行程。
* **情境 2：突然下雨，景點被打亂**
  - 出發前沒注意天氣預報，到了戶外景點才發現下大雨，缺少雨天室內備案切換提示。
* **情境 3：跳轉導航步驟繁瑣**
  - 看到景點名稱後，還要手動複製地址再貼到 Google Maps App 搜尋。

---

## 2. 解決方案與功能亮點 (Key Features)

1. **當日即時焦點卡片 (Live Travel Dashboard Card)**：
   - 當目前系統時間落在「旅程日期範圍內」時，在 `ItineraryPage` 或首頁頂部自動置頂 **「📍 NOW & NEXT」流體動態焦點卡**：
     - **進行中活動**：顯示當前停留的景點、預計結束時間。
     - **下一個目標**：倒數計時（例如：「距離出發還有 25 分鐘」）。
     - **一鍵導航捷徑**：直接呼叫原生 Google Maps / Apple Maps 導航至該景點經緯度。
   - 非旅程期間提供「預覽模式 / 快速跳至第一天」。
2. **免金鑰即時天氣預報 (Free Weather Forecast via Open-Meteo)**：
   - 串接國際氣象開放 API **Open-Meteo**（開源、免申請 API Key、無限制額度）。
   - 根據該旅程第一個景點或主城市經緯度，自動獲取行程期間的 **當日氣溫（高溫/低溫）、降雨機率 %、天氣圖示**。
   - 若降雨機率 > 50%，自動附帶「☔️ 建議備傘或啟用室內備案」溫馨提示。

---

## 3. 目標檔案矩陣 (Target File Matrix)

| 操作 | 檔案路徑 | 職責與說明 |
|:---|:---|:---|
| **新增** | `src/services/weather/WeatherService.ts` | 呼叫 Open-Meteo API 獲取每日氣象預報 |
| **新增** | `src/hooks/weather/useTripWeather.ts` | 根據旅程地標獲取天氣快取資料的 Hook |
| **新增** | `src/components/itinerary/LiveTravelFocusCard.tsx` | 置頂的當日即時焦點卡片（含進度與一鍵導航） |
| **新增** | `src/components/itinerary/WeatherForecastBar.tsx` | 天氣概況膠囊列（顯示晴雨與降雨機率） |
| **新增** | `src/utils/NavigationUtil.ts` | 自動依手機平台開啟 Google Maps / Apple Maps 導航 URL |
| **整合** | [`src/page/Book/ItineraryPage.tsx`](file:///d:/Projects/travel-app/src/page/Book/ItineraryPage.tsx) | 在天數切換列上方嵌入 Live 焦點卡與天氣概況 |

---

## 4. 驗收標準 (Acceptance Criteria)

1. [ ] 在旅程進行當日，打開行程頁時頂部醒目展示目前正在進行與下一項活動，並具備倒數進度。
2. [ ] 點擊「開始導航」能無縫在 iOS 開啟 Apple Maps / Google Maps，在 Android 或電腦端開啟 Google Maps 路線。
3. [ ] 天氣模組在輸入具備經緯度的行程時，能成功呈現 7 日天氣圖示、氣溫與降雨機率，無須任何付費 API Key。
