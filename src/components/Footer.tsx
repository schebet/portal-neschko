import { useDialect } from "@/contexts/DialectContext";
import { Facebook, Instagram, Youtube, Twitter, Send } from "lucide-react";

export function Footer() {
  const { t } = useDialect();

  return (
    <footer className="bg-primary text-primary-foreground mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-serif font-bold text-lg mb-3">{t("О нама")}</h4>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              {t("Заплање — локални портал посвећен вестима, култури, традицији и животу у заплањском крају. Повезујемо заједницу и чувамо наслеђе.")}
            </p>
          </div>
          <div>
            <h4 className="font-serif font-bold text-lg mb-3">{t("Пратите нас")}</h4>
            <div className="flex items-center gap-4">
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors" aria-label="Facebook">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors" aria-label="Instagram">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors" aria-label="YouTube">
                <Youtube className="h-6 w-6" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors" aria-label="Twitter">
              <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors" aria-label="Telegram">
                <Send className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-xs text-primary-foreground/50">
          <span>© 2026 Заплање — {t("Локални портал")}. {t("Сва права задржана")}.</span>
        </div>
      </div>
    </footer>
  );
}
