import React from 'react';
import { X, HelpCircle, Eye, Box, Compass, Lightbulb, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Jak funguje testování prostorové představivosti
              </h2>
              <p className="text-xs text-slate-400">
                Principy Mongeova pravoúhlého promítání drátu na krychli
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
          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-amber-400 flex items-center gap-2">
              <Box className="w-4 h-4" />
              1. Značení vrcholů krychle (česká norma)
            </h3>
            <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
              Krychle má 8 vrcholů rozdělených na dolní a horní podstavu:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                <strong className="text-cyan-400 font-sans block mb-1">Dolní podstava (ABCD):</strong>
                <ul className="space-y-0.5 text-slate-400">
                  <li><span className="text-slate-200 font-bold">A</span>: vlevo vpředu dole</li>
                  <li><span className="text-slate-200 font-bold">B</span>: vpravo vpředu dole</li>
                  <li><span className="text-slate-200 font-bold">C</span>: vpravo vzadu dole</li>
                  <li><span className="text-slate-200 font-bold">D</span>: vlevo vzadu dole</li>
                </ul>
              </div>
              <div>
                <strong className="text-emerald-400 font-sans block mb-1">Horní podstava (EFGH):</strong>
                <ul className="space-y-0.5 text-slate-400">
                  <li><span className="text-slate-200 font-bold">E</span>: vlevo vpředu nahoře (nad A)</li>
                  <li><span className="text-slate-200 font-bold">F</span>: vpravo vpředu nahoře (nad B)</li>
                  <li><span className="text-slate-200 font-bold">G</span>: vpravo vzadu nahoře (nad C)</li>
                  <li><span className="text-slate-200 font-bold">H</span>: vlevo vzadu nahoře (nad D)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-emerald-400 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              2. Pravoúhlé průměty (Nárys a Půdorys)
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <strong className="text-amber-300 block mb-1">Nárys (Pohled zepředu, index 2):</strong>
                Paprsky promítání míří zepředu dozadu kolmo na svislou nárysnu ν. Přední a zadní vrcholy splývají:
                <div className="mt-1 text-xs font-mono text-slate-400">
                  <span className="text-slate-200">E₂ ≡ H₂</span> (vlevo nahoře),{' '}
                  <span className="text-slate-200">F₂ ≡ G₂</span> (vpravo nahoře),{' '}
                  <span className="text-slate-200">A₂ ≡ D₂</span> (vlevo dole),{' '}
                  <span className="text-slate-200">B₂ ≡ C₂</span> (vpravo dole).
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <strong className="text-emerald-300 block mb-1">Půdorys (Pohled shora, index 1):</strong>
                Paprsky promítání míří shora dolů kolmo na vodorovnou půdorysnu π. Horní a dolní vrcholy splývají. Vpředu je dolní okraj výkresu, vzadu je horní okraj:
                <div className="mt-1 text-xs font-mono text-slate-400">
                  <span className="text-slate-200">D₁ ≡ H₁</span> (vlevo vzadu/nahoře),{' '}
                  <span className="text-slate-200">C₁ ≡ G₁</span> (vpravo vzadu/nahoře),{' '}
                  <span className="text-slate-200">A₁ ≡ E₁</span> (vlevo vpředu/dole),{' '}
                  <span className="text-slate-200">B₁ ≡ F₁</span> (vpravo vpředu/dole).
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-cyan-400 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              3. Zvláštní jev: Bodový průmět
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Když segment drátu vede rovnoběžně se směrem pohledu (např. hrana <strong>A-D</strong> při pohledu zepředu nebo hrana <strong>A-E</strong> při pohledu shora), v průmětu se zobrazí jako pouhý <strong>bod</strong>! V aplikaci je takový úsek zvýrazněn kroužkem.
            </p>
          </div>

          {/* Section 4: Doporučený postup */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <h4 className="text-sm font-bold text-amber-300 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Doporučený tréninkový postup:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-slate-300">
              <li>Podívejte se na 3D drátěnou krychli a najděte zelený startovací vrchol.</li>
              <li>Prstem nebo myšlenkou sledujte drát segment po segmentu.</li>
              <li>Představte si, jak se každý segment promítne zepředu (Nárys).</li>
              <li>Poté klikněte na <strong>„Odkrýt nárys“</strong> a porovnejte svoji představu s realitou.</li>
              <li>Stejný postup zopakujte pro <strong>Půdorys</strong> (pohled shora).</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
          >
            Rozumím, jdeme trénovat!
          </button>
        </div>
      </div>
    </div>
  );
};
