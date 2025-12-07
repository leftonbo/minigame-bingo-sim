# AGENTS.md

このドキュメントはAIエージェントがこのプロジェクトで作業する際の指示を記載しています。

## プロジェクト概要

ブラウザで動作するビンゴ風ゲームシミュレーター。

- **技術スタック**: Vite + TypeScript + Vanilla CSS
- **開発サーバー**: `npm run dev` → http://localhost:5173

## ディレクトリ構造

```
src/
├── types.ts      # 型定義（CellState, BingoCard, DrawResult, etc.）
├── bonus.ts      # ボーナスシステム（拡張可能）
├── statistics.ts # 統計管理
├── game.ts       # ゲームロジック
├── main.ts       # UIレンダリング
└── style.css     # スタイル
```

## ゲームルール

- 5x5のビンゴカード（1〜25、左上から下へ配置）
- 13はフリーマス（常にアクティブ）
- 抽選で13が出た場合：ボーナス発生（2マスをランダムにアクティブ化）
- 縦・横・斜めに5マス揃うと1ライン = 1点
- ライン成立後、そのマスは次回抽選開始時に非アクティブに戻る（13以外）

## コーディング規約

- TypeScriptの `verbatimModuleSyntax` が有効。型のみのインポートは `import type { ... }` を使用
- enumは使用禁止。代わりに `as const` オブジェクトを使用
- 日本語コメント推奨

## ボーナスシステムの拡張

新しいボーナスを追加する場合:

1. `types.ts` の `BonusType` に新しいタイプを追加
2. `bonus.ts` に `BonusHandler` を実装した新しいクラスを作成
3. `createDefaultBonusRegistry()` でレジストリに登録
4. 必要に応じて `getBonusForNumber()` を更新

## テスト・検証

```bash
# 型チェック
npx tsc --noEmit

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```
