---
description: Build the project and deploy it to Vercel, then report the live URL
allowed-tools: Bash, Read, Edit, Write, Glob, Grep
---

# Deploy to Vercel

把這個 Treasure Hunt 專案部署到 Vercel,部署完成後**告訴使用者最終的 production URL**。

## 步驟

1. **確認 Vercel CLI**:執行 `vercel --version`。若找不到指令,用 `npm i -g vercel` 全域安裝。

2. **確認登入狀態**:執行 `vercel whoami`。
   - 若未登入(指令失敗),**不要**嘗試在背景跑互動式登入(`vercel login` 需要瀏覽器/輸入)。請停下來告訴使用者:在終端機輸入 `! vercel login` 完成登入後再重跑本指令。

3. **本地建置驗證**:執行 `npm run build`,確認 Vite 能成功輸出到 `build/`(設定見 `vite.config.ts` 的 `build.outDir`)。建置失敗就先修好再繼續。

4. **準備 Vercel 設定**:本專案前端是 Vite,輸出目錄是 `build/`(非預設的 `dist/`)。若 repo 根目錄沒有 `vercel.json`,建立一個指向正確輸出目錄的設定:

   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "build"
   }
   ```

5. **部署**:執行 `vercel --prod --yes`(`--yes` 跳過互動式提問,沿用偵測到的設定)。從輸出擷取 `https://...vercel.app` 的 production URL。

6. **回報**:把最終的 production URL **明確地**回報給使用者(單獨一行、可點擊)。若部署失敗,貼出錯誤訊息並說明原因。

## 重要注意事項(後端限制)

⚠️ 這個專案有一個 **Node/Express 後端**(`server/`)使用 Node 內建的 `node:sqlite` 搭配本機 `game.db` 檔案做登入與分數記錄。**這在 Vercel 上無法直接運作**,因為:

- Vercel 的 serverless 環境**沒有持久化的檔案系統**(`game.db` 每次冷啟動都會消失)。
- `node:sqlite` 需要 `--experimental-sqlite` 旗標,serverless 預設不會帶。

因此**預設只部署前端靜態網站**。登入/分數功能在線上版會無法連線(`/api/*` 沒有後端)。部署完成後**務必提醒使用者這一點**。

若使用者要連後端一起上線,需另外處理(例如改用 Vercel Postgres / 外部資料庫 + Serverless Functions,或把後端部署到支援持久化的平台如 Railway / Render),這超出本指令範圍 — 先詢問使用者是否要進行。
