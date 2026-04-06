import { Helmet } from 'react-helmet';
import { Download, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { generateResetPdf, downloadPdf } from '@/lib/generateResetPdf';

const Reset = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generateResetPdf();
      downloadPdf(pdfBytes, 'caliness-7-tage-reset.pdf');
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>7-Tage Reset | Caliness Academy</title>
        <meta
          name="description"
          content="Lade dir das Caliness 7-Tage Reset Framework als interaktives PDF herunter. 3 Seiten mit Einordnung, Säulen und klickbarem Protokoll."
        />
      </Helmet>

      <div className="min-h-screen bg-[#0a0c0e] flex flex-col items-center justify-center px-6">
        {/* Centered content container */}
        <div className="max-w-md w-full text-center space-y-10">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src="/images/caliness-logo-white.png" 
              alt="CALINESS" 
              className="h-12 opacity-90"
            />
          </div>

          {/* Badge */}
          <div className="inline-flex">
            <span className="text-xs font-medium tracking-[0.2em] text-[#2dd36f] uppercase px-4 py-2 border border-[#2dd36f]/30 rounded">
              Internes Framework
            </span>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-outfit">
              7-Tage Reset
            </h1>
            <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-sm mx-auto">
              Stabilisierung vor Optimierung.<br/>
              Ein strukturierter Ansatz zur Beruhigung des Systems.
            </p>
          </div>

          {/* Green divider */}
          <div className="flex justify-center">
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#2dd36f] to-transparent" />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href="/pdfs/caliness-7-tage-reset.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-14 px-8 text-base font-medium bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-white/40 transition-all duration-300 rounded-lg"
            >
              <ExternalLink className="w-5 h-5 mr-3" />
              Ansehen
            </a>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="inline-flex items-center justify-center h-14 px-8 text-base font-medium bg-gradient-to-r from-[#2dd36f] to-[#1fa855] text-[#0a0c0e] hover:shadow-lg hover:shadow-[#2dd36f]/20 transition-all duration-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5 mr-3" />
              {isGenerating ? 'Generiere...' : 'PDF herunterladen'}
            </button>
          </div>

          {/* Subtle info */}
          <p className="text-white/30 text-xs">
            3 Seiten · A4 · Interaktive Checkboxen · Premium Design
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center">
          <p className="text-white/25 text-xs tracking-wide">
            Longevity als System.
          </p>
        </div>
      </div>
    </>
  );
};

export default Reset;
