'use client'

import { useLocale } from '@/lib/i18n'

function DeCookies() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Cookie-Richtlinie</h1>
      <p className="text-[var(--color-textMuted)]">Stand: 1. März 2026</p>

      <h2>1. Was sind Cookies?</h2>
      <p>
        Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, wenn Sie eine Website
        besuchen. Sie ermöglichen es der Website, Ihr Gerät bei späteren Besuchen wiederzuerkennen.
      </p>

      <h2>2. Welche Cookies verwenden wir?</h2>

      <h3>2.1 Technisch notwendige Cookies</h3>
      <p>
        Diese Cookies sind für den Betrieb der Website unerlässlich. Ohne sie können grundlegende
        Funktionen wie die Anmeldung und Navigation nicht gewährleistet werden.
      </p>
      <table>
        <thead>
          <tr><th>Cookie</th><th>Zweck</th><th>Speicherdauer</th></tr>
        </thead>
        <tbody>
          <tr><td>sb-*-auth-token</td><td>Authentifizierung (Supabase Session)</td><td>Sitzung / 7 Tage</td></tr>
          <tr><td>hookah-locale</td><td>Spracheinstellung</td><td>Dauerhaft (localStorage)</td></tr>
          <tr><td>cookie-consent</td><td>Speicherung Ihrer Cookie-Präferenz</td><td>Dauerhaft (localStorage)</td></tr>
          <tr><td>theme</td><td>Farbschema (Hell/Dunkel)</td><td>Dauerhaft (localStorage)</td></tr>
        </tbody>
      </table>
      <p>
        <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) sowie
        § 25 Abs. 2 Nr. 2 TTDSG (technisch notwendig).
      </p>

      <h3>2.2 Analyse- und Marketing-Cookies</h3>
      <p>
        Derzeit verwenden wir <strong>keine</strong> Analyse- oder Marketing-Cookies. Sollte sich dies
        in Zukunft ändern, werden wir diese Richtlinie aktualisieren und Ihre ausdrückliche Einwilligung
        einholen, bevor solche Cookies gesetzt werden.
      </p>

      <h2>3. Wie können Sie Cookies verwalten?</h2>
      <p>
        Sie können Cookies jederzeit über die Einstellungen Ihres Browsers verwalten oder löschen.
        Beachten Sie, dass das Deaktivieren technisch notwendiger Cookies die Funktionalität der
        Website einschränken kann.
      </p>
      <ul>
        <li><strong>Chrome:</strong> Einstellungen → Datenschutz und Sicherheit → Cookies</li>
        <li><strong>Firefox:</strong> Einstellungen → Datenschutz &amp; Sicherheit → Cookies</li>
        <li><strong>Safari:</strong> Einstellungen → Datenschutz → Cookies und Websitedaten</li>
        <li><strong>Edge:</strong> Einstellungen → Cookies und Websiteberechtigungen</li>
      </ul>

      <h2>4. Änderungen dieser Richtlinie</h2>
      <p>
        Wir behalten uns vor, diese Cookie-Richtlinie bei Bedarf zu aktualisieren. Die aktuelle Version
        ist stets auf dieser Seite abrufbar.
      </p>

      <h2>5. Kontakt</h2>
      <p>
        Bei Fragen zu dieser Cookie-Richtlinie wenden Sie sich bitte an:<br />
        E-Mail: <a href="mailto:htorus@hookahtorus.com">htorus@hookahtorus.com</a>
      </p>
    </article>
  )
}

function EnCookies() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Cookie Policy</h1>
      <p className="text-[var(--color-textMuted)]">Effective date: March 1, 2026</p>

      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They allow the
        website to recognize your device on subsequent visits.
      </p>

      <h2>2. What Cookies Do We Use?</h2>

      <h3>2.1 Essential Cookies</h3>
      <p>
        These cookies are necessary for the website to function. Without them, basic features like
        login and navigation cannot be provided.
      </p>
      <table>
        <thead>
          <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr><td>sb-*-auth-token</td><td>Authentication (Supabase session)</td><td>Session / 7 days</td></tr>
          <tr><td>hookah-locale</td><td>Language preference</td><td>Persistent (localStorage)</td></tr>
          <tr><td>cookie-consent</td><td>Your cookie preference</td><td>Persistent (localStorage)</td></tr>
          <tr><td>theme</td><td>Color scheme (light/dark)</td><td>Persistent (localStorage)</td></tr>
        </tbody>
      </table>
      <p>
        <strong>Legal basis:</strong> Art. 6(1)(f) GDPR (legitimate interest) and § 25(2)(2) TTDSG
        (technically necessary).
      </p>

      <h3>2.2 Analytics and Marketing Cookies</h3>
      <p>
        We currently do <strong>not</strong> use any analytics or marketing cookies. Should this change
        in the future, we will update this policy and obtain your explicit consent before setting such
        cookies.
      </p>

      <h2>3. How Can You Manage Cookies?</h2>
      <p>
        You can manage or delete cookies at any time through your browser settings. Note that disabling
        essential cookies may limit website functionality.
      </p>

      <h2>4. Changes to This Policy</h2>
      <p>
        We reserve the right to update this cookie policy as needed. The current version is always
        available on this page.
      </p>

      <h2>5. Contact</h2>
      <p>
        For questions about this cookie policy, contact us at:<br />
        Email: <a href="mailto:htorus@hookahtorus.com">htorus@hookahtorus.com</a>
      </p>
    </article>
  )
}

function RuCookies() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Политика Cookie</h1>
      <p className="text-[var(--color-textMuted)]">Дата вступления в силу: 1 марта 2026 г.</p>

      <h2>1. Что такое Cookie?</h2>
      <p>
        Cookie — это небольшие текстовые файлы, сохраняемые на вашем устройстве при посещении
        веб-сайта. Они позволяют сайту распознавать ваше устройство при последующих визитах.
      </p>

      <h2>2. Какие Cookie мы используем?</h2>

      <h3>2.1 Технически необходимые Cookie</h3>
      <p>
        Эти cookie необходимы для работы сайта. Без них базовые функции, такие как вход в систему
        и навигация, не могут быть обеспечены.
      </p>
      <table>
        <thead>
          <tr><th>Cookie</th><th>Назначение</th><th>Срок хранения</th></tr>
        </thead>
        <tbody>
          <tr><td>sb-*-auth-token</td><td>Аутентификация (сессия Supabase)</td><td>Сессия / 7 дней</td></tr>
          <tr><td>hookah-locale</td><td>Языковые настройки</td><td>Постоянно (localStorage)</td></tr>
          <tr><td>cookie-consent</td><td>Ваш выбор по cookie</td><td>Постоянно (localStorage)</td></tr>
          <tr><td>theme</td><td>Цветовая схема (светлая/тёмная)</td><td>Постоянно (localStorage)</td></tr>
        </tbody>
      </table>
      <p>
        <strong>Правовое основание:</strong> Ст. 6(1)(f) GDPR (законный интерес) и § 25(2)(2) TTDSG
        (технически необходимо).
      </p>

      <h3>2.2 Аналитические и маркетинговые Cookie</h3>
      <p>
        В настоящее время мы <strong>не используем</strong> аналитические или маркетинговые cookie.
        Если это изменится, мы обновим данную политику и запросим ваше явное согласие.
      </p>

      <h2>3. Как управлять Cookie?</h2>
      <p>
        Вы можете управлять cookie или удалить их через настройки браузера. Учтите, что отключение
        технически необходимых cookie может ограничить функциональность сайта.
      </p>

      <h2>4. Изменения в политике</h2>
      <p>
        Мы оставляем за собой право обновлять эту политику. Актуальная версия всегда доступна на
        этой странице.
      </p>

      <h2>5. Контакт</h2>
      <p>
        По вопросам о cookie обращайтесь:<br />
        E-Mail: <a href="mailto:htorus@hookahtorus.com">htorus@hookahtorus.com</a>
      </p>
    </article>
  )
}

export default function CookiesContent() {
  const { locale } = useLocale()

  if (locale === 'de') return <DeCookies />
  if (locale === 'en') return <EnCookies />
  return <RuCookies />
}
