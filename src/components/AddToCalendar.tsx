"use client";

import { useState } from "react";
import type { Lang } from "@/lib/types";

const T: Record<string, Record<Lang, string>> = {
  button: { en: "Add to my calendar", fr: "Ajouter à mon calendrier", pt: "Adicionar à minha agenda", es: "Añadir a mi calendario" },
  intro: {
    en: "Subscribe once: new activities appear on their own, with a reminder an hour before.",
    fr: "Abonnez-vous une fois : les nouvelles activités s’ajoutent d’elles-mêmes, avec un rappel une heure avant.",
    pt: "Assine uma vez: as novas atividades aparecem sozinhas, com um lembrete uma hora antes.",
    es: "Suscríbase una vez: las nuevas actividades aparecen solas, con un recordatorio una hora antes.",
  },
  apple: { en: "iPhone, iPad or Mac", fr: "iPhone, iPad ou Mac", pt: "iPhone, iPad ou Mac", es: "iPhone, iPad o Mac" },
  google: { en: "Android or Google Calendar", fr: "Android ou Google Agenda", pt: "Android ou Google Agenda", es: "Android o Google Calendar" },
  googleHint: {
    en: "Sign in with your Google account and confirm. It then shows in the Google Calendar app on your phone. Set your reminder in that calendar’s settings.",
    fr: "Connectez-vous à votre compte Google et confirmez. Il apparaîtra ensuite dans l’application Google Agenda de votre téléphone. Réglez le rappel dans les paramètres de ce calendrier.",
    pt: "Entre com sua conta Google e confirme. Depois ela aparece no app Google Agenda do celular. Escolha o lembrete nas configurações dessa agenda.",
    es: "Inicie sesión con su cuenta de Google y confirme. Luego aparecerá en la app Google Calendar de su teléfono. Elija el recordatorio en la configuración de ese calendario.",
  },
  outlook: { en: "Outlook", fr: "Outlook", pt: "Outlook", es: "Outlook" },
  copy: { en: "Copy the link for another app", fr: "Copier le lien pour une autre application", pt: "Copiar o link para outro app", es: "Copiar el enlace para otra app" },
  copied: { en: "Link copied", fr: "Lien copié", pt: "Link copiado", es: "Enlace copiado" },
};

/** The "Add to my calendar" button on a public calendar page: subscribe on iPhone, Android/Google or Outlook. */
export default function AddToCalendar({ feedUrl, name, lang }: { feedUrl: string; name: string; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const t = (k: keyof typeof T) => T[k][lang] ?? T[k].en;
  const webcal = feedUrl.replace(/^https?:/, "webcal:");
  const google = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`;
  const outlook = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl)}&name=${encodeURIComponent(name)}`;

  return (
    <div className="add-cal">
      <button className="btn" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span aria-hidden>📅</span> {t("button")}
      </button>
      {open && (
        <div className="add-cal-menu" role="menu">
          <p className="muted">{t("intro")}</p>
          <a className="add-cal-option" href={webcal} role="menuitem">
            <strong>{t("apple")}</strong>
          </a>
          <a className="add-cal-option" href={google} target="_blank" rel="noreferrer" role="menuitem">
            <strong>{t("google")}</strong>
            <small>{t("googleHint")}</small>
          </a>
          <a className="add-cal-option" href={outlook} target="_blank" rel="noreferrer" role="menuitem">
            <strong>{t("outlook")}</strong>
          </a>
          <button
            className="add-cal-option"
            role="menuitem"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(feedUrl);
                setCopied(true);
              } catch {
                window.prompt(t("copy"), feedUrl);
              }
            }}
          >
            <strong>{copied ? `✓ ${t("copied")}` : t("copy")}</strong>
          </button>
        </div>
      )}
    </div>
  );
}
