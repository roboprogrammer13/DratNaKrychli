import React, { useState } from 'react';
import { X, Globe, Copy, Check, Terminal, GitBranch, Sparkles } from 'lucide-react';

interface GitHubPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPagesModal: React.FC<GitHubPagesModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const workflowYaml = `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

  const manualCommands = `# 1. Sestavení projektu (výstup bude ve složce dist)
npm run build

# 2. Publikace přes balíček gh-pages:
npx gh-pages -d dist
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Publikace na GitHub Pages
              </h2>
              <p className="text-xs text-slate-400">
                Aplikace je již nakonfigurována s relativními cestami (<code className="text-amber-300">base: './'</code>)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-xs sm:text-sm text-emerald-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              Projekt je plně připraven! Ve <code className="font-mono font-bold">vite.config.ts</code> je nastaveno <code className="font-mono bg-emerald-950/60 px-1 py-0.5 rounded">base: './'</code>, takže sestavené soubory fungují na jakékoliv podsložce repozitáře (např. <code className="font-mono">uzivatel.github.io/dratena-krychle/</code>).
            </div>
          </div>

          {/* Option 1: GitHub Actions (Recommended) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                Možnost A: Automaticky přes GitHub Actions (Doporučeno)
              </h3>
              <button
                onClick={() => copyToClipboard(workflowYaml, 'yaml')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/40 transition"
              >
                {copiedKey === 'yaml' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Zkopírováno!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopírovat YAML</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Vytvořte v repozitáři soubor <code className="text-slate-200 font-mono">.github/workflows/deploy.yml</code> a vložte do něj:
            </p>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
              {workflowYaml}
            </pre>
            <p className="text-xs text-slate-400">
              V repozitáři na GitHubu pak v <strong>Settings → Pages → Source</strong> vyberte <strong>GitHub Actions</strong>. Každý git push na <code className="text-slate-200">main</code> aplikaci automaticky nasadí!
            </p>
          </div>

          {/* Option 2: Quick manual deploy */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Možnost B: Rychlý příkaz z terminálu
              </h3>
              <button
                onClick={() => copyToClipboard(manualCommands, 'cmd')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40 transition"
              >
                {copiedKey === 'cmd' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Zkopírováno!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopírovat příkazy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-amber-300/90 overflow-x-auto">
              {manualCommands}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
