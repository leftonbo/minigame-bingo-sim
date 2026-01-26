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

## git コミットメッセージ規則

git コミットメッセージに [gitmoji](https://raw.githubusercontent.com/carloscuesta/gitmoji/refs/heads/master/packages/gitmojis/src/gitmojis.json) を使用してください。

```text
<intention> [scope?][:?] <message>
```

- intention: gitmoji リストから選択した絵文字。
- scope: 変更範囲を示すオプションの文字列。
- message: 変更内容の要約。

### gitmoji 一覧

- 🎉: プロジェクト立ち上げ時 (first commit)
- ✨️: 新機能追加
- 🐛: バグ修正
- 🩹: 軽微なバグ修正
- ♻️: リファクタリング
- ⚡️: パフォーマンス改善
- 🔥: 不要なコード・ファイルの削除
- 🔨: エディタツールの変更
- 🔧: パラメーター・設定ファイルの修正
- 💡: コメントの追加・修正
- ✏️: typo 修正
- 🔊: ログの追加・修正
- 🔇: ログの削除
- 🙈: gitignore の変更
- 🚚: ファイル・フォルダの移動・リネーム
- 🗃️: データベースの変更
- 🍱: 画像・音声などアセットファイルの変更
- ➕️: 依存関係の追加
- ➖️: 依存関係の削除
- ⬆️: 依存関係のアップデート
- ⬇️: 依存関係のダウンデート
- ✅️: テストコードの追加・更新・修正
- 🚧: 作業途中
- ⚗️: 実験的コード
- 🔀: マージコミット (merge)
- ⏪️: 元に戻す (revert)

### 例

```text
✨️ traveler-world: トラベラー世界観メモを追加
```

```text
🔧 ai-roguelite: おばけ世界の主人公の初期パラメーターを調整
```

```text
♻️ eel-rpg-game: キャラクター能力値計算ロジックをリファクタリング
```

### 詳細なメッセージ

コミット内容が非常に多い場合、2行目以降に詳細を箇条書きで追加する。

```text
✨️ traveler-world: トラベラー世界観メモを追加
- 基本コンセプト、旅の装備、派閥、暦設定、ロアキーワードを含む
- AI Roguelite 用の設定も記載
```

### 注意事項

- **コミット粒度**: 変更内容ごとにコミットを分け、1コミット1目的を心がける。
- **メッセージの明確化**: 変更内容が一目でわかるように具体的に記述する。
- **一貫性の維持**: 既存のコミットメッセージスタイルと一貫性を保つ。
