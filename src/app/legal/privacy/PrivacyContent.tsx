'use client'

import { useLocale } from '@/lib/i18n'

function RuPrivacy() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Политика конфиденциальности</h1>
      <p className="text-[var(--color-textMuted)]">Дата вступления в силу: 20 февраля 2026 г.</p>

      <h2>1. Ответственный за обработку данных</h2>
      <p>
        Ответственным за обработку персональных данных в соответствии с Регламентом (ЕС) 2016/679 (GDPR) является:
      </p>
      <p>
        Oleksii Yagich<br />
        Hookah Torus<br />
        E-Mail: <a href="mailto:oleksii@hookahtorus.com">oleksii@hookahtorus.com</a><br />
        Сайт: hookahtorus.com
      </p>

      <h2>2. Какие данные мы собираем</h2>
      <h3>2.1. Данные, предоставленные вами</h3>
      <ul>
        <li>Email-адрес и пароль при регистрации</li>
        <li>Название заведения и имя владельца</li>
        <li>Телефон и адрес (опционально)</li>
        <li>Данные инвентаря, сессий, миксов и гостей, введённые вами в систему</li>
      </ul>
      <h3>2.2. Данные, собираемые автоматически</h3>
      <ul>
        <li>IP-адрес и данные браузера (User-Agent)</li>
        <li>Cookies для поддержания сессии авторизации</li>
        <li>Данные об использовании Сервиса (просмотры страниц, действия)</li>
      </ul>
      <h3>2.3. Платёжные данные</h3>
      <p>
        Оплата обрабатывается через Stripe Inc. Мы не храним данные банковских карт.
        Stripe обрабатывает платежи в соответствии со стандартом PCI DSS.
        Политика конфиденциальности Stripe: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>
      </p>

      <h2>3. Правовое основание обработки данных</h2>
      <p>Мы обрабатываем ваши персональные данные на следующих основаниях (ст. 6 GDPR):</p>
      <table className="text-sm">
        <thead>
          <tr><th>Цель обработки</th><th>Правовое основание</th></tr>
        </thead>
        <tbody>
          <tr><td>Регистрация и аутентификация</td><td>Исполнение договора (ст. 6(1)(b))</td></tr>
          <tr><td>Функциональность сервиса (инвентарь, миксы, аналитика)</td><td>Исполнение договора (ст. 6(1)(b))</td></tr>
          <tr><td>Обработка платежей</td><td>Исполнение договора (ст. 6(1)(b))</td></tr>
          <tr><td>Email-уведомления (маркетинг)</td><td>Согласие (ст. 6(1)(a))</td></tr>
          <tr><td>Push / Telegram уведомления</td><td>Согласие (ст. 6(1)(a))</td></tr>
          <tr><td>Техническое обеспечение безопасности (IP-логи)</td><td>Законный интерес (ст. 6(1)(f))</td></tr>
          <tr><td>Cookies для авторизации</td><td>Законный интерес (ст. 6(1)(f)) — строго необходимые</td></tr>
        </tbody>
      </table>

      <h2>4. Хранение и защита данных</h2>
      <p>
        Данные хранятся на серверах Supabase (инфраструктура AWS, регион EU — Франкфурт).
        Передача данных шифруется с использованием TLS 1.3.
        Доступ к базе данных ограничен политиками Row Level Security (RLS).
        Пароли хранятся в хешированном виде (bcrypt).
      </p>

      <h2>5. Сроки хранения данных</h2>
      <table className="text-sm">
        <thead>
          <tr><th>Тип данных</th><th>Срок хранения</th></tr>
        </thead>
        <tbody>
          <tr><td>Данные аккаунта (email, профиль)</td><td>До удаления аккаунта</td></tr>
          <tr><td>Бизнес-данные (инвентарь, сессии, миксы)</td><td>До удаления аккаунта</td></tr>
          <tr><td>Платёжная история</td><td>10 лет (законодательное требование)</td></tr>
          <tr><td>Серверные логи (IP-адреса)</td><td>30 дней</td></tr>
          <tr><td>Данные cookie-согласия</td><td>12 месяцев</td></tr>
        </tbody>
      </table>

      <h2>6. Передача данных третьим лицам</h2>
      <p>Мы не продаём ваши персональные данные. Для работы Сервиса мы используем следующих обработчиков данных:</p>
      <table className="text-sm">
        <thead>
          <tr><th>Поставщик</th><th>Назначение</th><th>Расположение</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase Inc.</td><td>База данных и аутентификация</td><td>EU (Франкфурт)</td></tr>
          <tr><td>Stripe Inc.</td><td>Обработка платежей</td><td>EU / USA (SCC)</td></tr>
          <tr><td>Resend Inc.</td><td>Email-уведомления</td><td>USA (SCC)</td></tr>
          <tr><td>Vercel Inc.</td><td>Хостинг приложения</td><td>EU (Франкфурт)</td></tr>
        </tbody>
      </table>
      <p>
        При передаче данных в США используются стандартные договорные оговорки (SCC)
        в соответствии со ст. 46(2)(c) GDPR.
      </p>

      <h2>7. Cookies</h2>
      <p>Мы используем следующие cookies:</p>
      <table className="text-sm">
        <thead>
          <tr><th>Cookie</th><th>Тип</th><th>Назначение</th><th>Срок</th></tr>
        </thead>
        <tbody>
          <tr><td>sb-*-auth-token</td><td>Строго необходимый</td><td>Сессия авторизации Supabase</td><td>До выхода</td></tr>
          <tr><td>cookie-consent</td><td>Строго необходимый</td><td>Запоминание решения о cookies</td><td>12 месяцев</td></tr>
        </tbody>
      </table>
      <p>Мы не используем рекламные, аналитические или отслеживающие cookies.</p>

      <h2>8. Ваши права</h2>
      <p>В соответствии с GDPR вы имеете право:</p>
      <ul>
        <li><strong>Право на доступ</strong> (ст. 15) — запросить информацию о ваших персональных данных</li>
        <li><strong>Право на исправление</strong> (ст. 16) — исправить неточные данные через личный кабинет</li>
        <li><strong>Право на удаление</strong> (ст. 17) — удалить свой аккаунт и все данные через Настройки → Удалить аккаунт</li>
        <li><strong>Право на ограничение обработки</strong> (ст. 18) — запросить ограничение обработки данных</li>
        <li><strong>Право на переносимость данных</strong> (ст. 20) — получить ваши данные в машиночитаемом формате</li>
        <li><strong>Право на возражение</strong> (ст. 21) — возразить против обработки на основе законного интереса</li>
        <li><strong>Право отозвать согласие</strong> (ст. 7(3)) — отключить уведомления в настройках в любой момент</li>
      </ul>
      <p>
        Для реализации своих прав обращайтесь по адресу:{' '}
        <a href="mailto:oleksii@hookahtorus.com">oleksii@hookahtorus.com</a>
      </p>

      <h2>9. Право на жалобу</h2>
      <p>
        Вы имеете право подать жалобу в надзорный орган по защите персональных данных.
        Если вы находитесь в Германии, вы можете обратиться в компетентный орган вашей федеральной земли.
        Список надзорных органов:{' '}
        <a href="https://www.bfdi.bund.de/DE/Service/Anschriften/Laender/Laender-node.html" target="_blank" rel="noopener noreferrer">
          bfdi.bund.de
        </a>
      </p>

      <h2>10. Изменения политики</h2>
      <p>
        Мы оставляем за собой право обновлять данную Политику. При существенных изменениях
        пользователи будут уведомлены через email. Актуальная версия всегда доступна
        по адресу hookahtorus.com/legal/privacy.
      </p>

      <h2>11. Контакты</h2>
      <p>
        По вопросам, связанным с обработкой персональных данных:<br />
        E-Mail: <a href="mailto:oleksii@hookahtorus.com">oleksii@hookahtorus.com</a>
      </p>
    </article>
  )
}

function EnPrivacy() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-[var(--color-textMuted)]">Effective date: February 20, 2026</p>

      <h2>1. Data Controller</h2>
      <p>
        The data controller responsible for processing personal data in accordance with Regulation (EU) 2016/679 (GDPR) is:
      </p>
      <p>
        Oleksii Yagich<br />
        Hookah Torus<br />
        Email: <a href="mailto:oleksii@hookahtorus.com">oleksii@hookahtorus.com</a><br />
        Website: hookahtorus.com
      </p>

      <h2>2. Data We Collect</h2>
      <h3>2.1. Data Provided by You</h3>
      <ul>
        <li>Email address and password upon registration</li>
        <li>Venue name and owner name</li>
        <li>Phone number and address (optional)</li>
        <li>Inventory, session, mix, and guest data entered into the system</li>
      </ul>
      <h3>2.2. Data Collected Automatically</h3>
      <ul>
        <li>IP address and browser information (User-Agent)</li>
        <li>Cookies to maintain authentication sessions</li>
        <li>Service usage data (page views, actions)</li>
      </ul>
      <h3>2.3. Payment Data</h3>
      <p>
        Payments are processed through Stripe Inc. We do not store credit card data.
        Stripe processes payments in accordance with PCI DSS standards.
        Stripe&apos;s privacy policy: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>
      </p>

      <h2>3. Legal Basis for Processing</h2>
      <p>We process your personal data on the following legal grounds (Art. 6 GDPR):</p>
      <table className="text-sm">
        <thead>
          <tr><th>Purpose</th><th>Legal Basis</th></tr>
        </thead>
        <tbody>
          <tr><td>Registration and authentication</td><td>Performance of contract (Art. 6(1)(b))</td></tr>
          <tr><td>Service functionality (inventory, mixes, analytics)</td><td>Performance of contract (Art. 6(1)(b))</td></tr>
          <tr><td>Payment processing</td><td>Performance of contract (Art. 6(1)(b))</td></tr>
          <tr><td>Email notifications (marketing)</td><td>Consent (Art. 6(1)(a))</td></tr>
          <tr><td>Push / Telegram notifications</td><td>Consent (Art. 6(1)(a))</td></tr>
          <tr><td>Technical security (IP logs)</td><td>Legitimate interest (Art. 6(1)(f))</td></tr>
          <tr><td>Authentication cookies</td><td>Legitimate interest (Art. 6(1)(f)) — strictly necessary</td></tr>
        </tbody>
      </table>

      <h2>4. Data Storage and Security</h2>
      <p>
        Data is stored on Supabase servers (AWS infrastructure, EU region — Frankfurt).
        Data transmission is encrypted using TLS 1.3.
        Database access is restricted by Row Level Security (RLS) policies.
        Passwords are stored in hashed form (bcrypt).
      </p>

      <h2>5. Data Retention Periods</h2>
      <table className="text-sm">
        <thead>
          <tr><th>Data Type</th><th>Retention Period</th></tr>
        </thead>
        <tbody>
          <tr><td>Account data (email, profile)</td><td>Until account deletion</td></tr>
          <tr><td>Business data (inventory, sessions, mixes)</td><td>Until account deletion</td></tr>
          <tr><td>Payment history</td><td>10 years (legal requirement)</td></tr>
          <tr><td>Server logs (IP addresses)</td><td>30 days</td></tr>
          <tr><td>Cookie consent data</td><td>12 months</td></tr>
        </tbody>
      </table>

      <h2>6. Disclosure of Data to Third Parties</h2>
      <p>We do not sell your personal data. We use the following data processors to operate the Service:</p>
      <table className="text-sm">
        <thead>
          <tr><th>Provider</th><th>Purpose</th><th>Location</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase Inc.</td><td>Database and authentication</td><td>EU (Frankfurt)</td></tr>
          <tr><td>Stripe Inc.</td><td>Payment processing</td><td>EU / USA (SCC)</td></tr>
          <tr><td>Resend Inc.</td><td>Email notifications</td><td>USA (SCC)</td></tr>
          <tr><td>Vercel Inc.</td><td>Application hosting</td><td>EU (Frankfurt)</td></tr>
        </tbody>
      </table>
      <p>
        For data transfers to the USA, Standard Contractual Clauses (SCC) are used
        in accordance with Art. 46(2)(c) GDPR.
      </p>

      <h2>7. Cookies</h2>
      <p>We use the following cookies:</p>
      <table className="text-sm">
        <thead>
          <tr><th>Cookie</th><th>Type</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr><td>sb-*-auth-token</td><td>Strictly necessary</td><td>Supabase authentication session</td><td>Until logout</td></tr>
          <tr><td>cookie-consent</td><td>Strictly necessary</td><td>Remember cookie preference</td><td>12 months</td></tr>
        </tbody>
      </table>
      <p>We do not use advertising, analytics, or tracking cookies.</p>

      <h2>8. Your Rights</h2>
      <p>Under the GDPR, you have the following rights:</p>
      <ul>
        <li><strong>Right of access</strong> (Art. 15) — request information about your personal data</li>
        <li><strong>Right to rectification</strong> (Art. 16) — correct inaccurate data through your account settings</li>
        <li><strong>Right to erasure</strong> (Art. 17) — delete your account and all data via Settings → Delete Account</li>
        <li><strong>Right to restriction</strong> (Art. 18) — request restriction of data processing</li>
        <li><strong>Right to data portability</strong> (Art. 20) — receive your data in a machine-readable format</li>
        <li><strong>Right to object</strong> (Art. 21) — object to processing based on legitimate interest</li>
        <li><strong>Right to withdraw consent</strong> (Art. 7(3)) — disable notifications in settings at any time</li>
      </ul>
      <p>
        To exercise your rights, contact us at:{' '}
        <a href="mailto:oleksii@hookahtorus.com">oleksii@hookahtorus.com</a>
      </p>

      <h2>9. Right to Lodge a Complaint</h2>
      <p>
        You have the right to lodge a complaint with a supervisory authority for data protection.
        If you are located in Germany, you may contact the competent authority of your federal state.
        List of supervisory authorities:{' '}
        <a href="https://www.bfdi.bund.de/DE/Service/Anschriften/Laender/Laender-node.html" target="_blank" rel="noopener noreferrer">
          bfdi.bund.de
        </a>
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We reserve the right to update this Policy. In the event of material changes,
        users will be notified via email. The current version is always available
        at hookahtorus.com/legal/privacy.
      </p>

      <h2>11. Contact Information</h2>
      <p>
        For questions regarding the processing of personal data:<br />
        Email: <a href="mailto:oleksii@hookahtorus.com">oleksii@hookahtorus.com</a>
      </p>
    </article>
  )
}

function DePrivacy() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Datenschutzerkl&auml;rung</h1>
      <p className="text-[var(--color-textMuted)]">Stand: 20. Februar 2026</p>

      <h2>1. Verantwortlicher</h2>
      <p>
        Verantwortlicher f&uuml;r die Verarbeitung personenbezogener Daten gem&auml;&szlig; der
        Datenschutz-Grundverordnung (DSGVO) ist:
      </p>
      <p>
        Oleksii Yagich<br />
        Hookah Torus<br />
        E-Mail: <a href="mailto:oleksii@hookahtorus.com">oleksii@hookahtorus.com</a><br />
        Website: hookahtorus.com
      </p>

      <h2>2. Welche Daten wir erheben</h2>
      <h3>2.1. Von Ihnen bereitgestellte Daten</h3>
      <ul>
        <li>E-Mail-Adresse und Passwort bei der Registrierung</li>
        <li>Name des Standorts und des Inhabers</li>
        <li>Telefonnummer und Adresse (optional)</li>
        <li>Bestands-, Sitzungs-, Mischungs- und G&auml;stedaten, die Sie in das System eingeben</li>
      </ul>
      <h3>2.2. Automatisch erhobene Daten</h3>
      <ul>
        <li>IP-Adresse und Browserinformationen (User-Agent)</li>
        <li>Cookies zur Aufrechterhaltung der Authentifizierungssitzung</li>
        <li>Nutzungsdaten des Dienstes (Seitenaufrufe, Aktionen)</li>
      </ul>
      <h3>2.3. Zahlungsdaten</h3>
      <p>
        Zahlungen werden &uuml;ber Stripe Inc. abgewickelt. Wir speichern keine Kreditkartendaten.
        Stripe verarbeitet Zahlungen gem&auml;&szlig; dem PCI-DSS-Standard.
        Datenschutzerkl&auml;rung von Stripe: <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer">stripe.com/de/privacy</a>
      </p>

      <h2>3. Rechtsgrundlage der Verarbeitung</h2>
      <p>Wir verarbeiten Ihre personenbezogenen Daten auf folgenden Rechtsgrundlagen (Art. 6 DSGVO):</p>
      <table className="text-sm">
        <thead>
          <tr><th>Verarbeitungszweck</th><th>Rechtsgrundlage</th></tr>
        </thead>
        <tbody>
          <tr><td>Registrierung und Authentifizierung</td><td>Vertragserf&uuml;llung (Art. 6 Abs. 1 lit. b)</td></tr>
          <tr><td>Dienstfunktionalit&auml;t (Bestand, Mischungen, Analysen)</td><td>Vertragserf&uuml;llung (Art. 6 Abs. 1 lit. b)</td></tr>
          <tr><td>Zahlungsabwicklung</td><td>Vertragserf&uuml;llung (Art. 6 Abs. 1 lit. b)</td></tr>
          <tr><td>E-Mail-Benachrichtigungen (Marketing)</td><td>Einwilligung (Art. 6 Abs. 1 lit. a)</td></tr>
          <tr><td>Push-/Telegram-Benachrichtigungen</td><td>Einwilligung (Art. 6 Abs. 1 lit. a)</td></tr>
          <tr><td>Technische Sicherheit (IP-Protokolle)</td><td>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f)</td></tr>
          <tr><td>Authentifizierungs-Cookies</td><td>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f) — unbedingt erforderlich</td></tr>
        </tbody>
      </table>

      <h2>4. Datenspeicherung und Sicherheit</h2>
      <p>
        Die Daten werden auf Supabase-Servern gespeichert (AWS-Infrastruktur, Region EU — Frankfurt).
        Die Daten&uuml;bertragung wird mittels TLS 1.3 verschl&uuml;sselt.
        Der Datenbankzugriff ist durch Row-Level-Security-Richtlinien (RLS) beschr&auml;nkt.
        Passw&ouml;rter werden gehasht gespeichert (bcrypt).
      </p>

      <h2>5. Speicherdauer</h2>
      <table className="text-sm">
        <thead>
          <tr><th>Datenart</th><th>Speicherdauer</th></tr>
        </thead>
        <tbody>
          <tr><td>Kontodaten (E-Mail, Profil)</td><td>Bis zur Kontol&ouml;schung</td></tr>
          <tr><td>Gesch&auml;ftsdaten (Bestand, Sitzungen, Mischungen)</td><td>Bis zur Kontol&ouml;schung</td></tr>
          <tr><td>Zahlungshistorie</td><td>10 Jahre (gesetzliche Aufbewahrungspflicht)</td></tr>
          <tr><td>Serverprotokolle (IP-Adressen)</td><td>30 Tage</td></tr>
          <tr><td>Cookie-Einwilligungsdaten</td><td>12 Monate</td></tr>
        </tbody>
      </table>

      <h2>6. Weitergabe von Daten an Dritte</h2>
      <p>Wir verkaufen Ihre personenbezogenen Daten nicht. Zum Betrieb des Dienstes setzen wir folgende Auftragsverarbeiter ein:</p>
      <table className="text-sm">
        <thead>
          <tr><th>Anbieter</th><th>Zweck</th><th>Standort</th></tr>
        </thead>
        <tbody>
          <tr><td>Supabase Inc.</td><td>Datenbank und Authentifizierung</td><td>EU (Frankfurt)</td></tr>
          <tr><td>Stripe Inc.</td><td>Zahlungsabwicklung</td><td>EU / USA (SCC)</td></tr>
          <tr><td>Resend Inc.</td><td>E-Mail-Benachrichtigungen</td><td>USA (SCC)</td></tr>
          <tr><td>Vercel Inc.</td><td>Hosting der Anwendung</td><td>EU (Frankfurt)</td></tr>
        </tbody>
      </table>
      <p>
        Bei Daten&uuml;bermittlungen in die USA werden Standardvertragsklauseln (SCC)
        gem&auml;&szlig; Art. 46 Abs. 2 lit. c DSGVO verwendet.
      </p>

      <h2>7. Cookies</h2>
      <p>Wir verwenden folgende Cookies:</p>
      <table className="text-sm">
        <thead>
          <tr><th>Cookie</th><th>Typ</th><th>Zweck</th><th>Dauer</th></tr>
        </thead>
        <tbody>
          <tr><td>sb-*-auth-token</td><td>Unbedingt erforderlich</td><td>Supabase-Authentifizierungssitzung</td><td>Bis zum Abmelden</td></tr>
          <tr><td>cookie-consent</td><td>Unbedingt erforderlich</td><td>Speicherung der Cookie-Einwilligung</td><td>12 Monate</td></tr>
        </tbody>
      </table>
      <p>Wir verwenden keine Werbe-, Analyse- oder Tracking-Cookies.</p>

      <h2>8. Ihre Rechte</h2>
      <p>Gem&auml;&szlig; der DSGVO haben Sie folgende Rechte:</p>
      <ul>
        <li><strong>Auskunftsrecht</strong> (Art. 15) — Auskunft &uuml;ber Ihre gespeicherten personenbezogenen Daten</li>
        <li><strong>Recht auf Berichtigung</strong> (Art. 16) — Korrektur unrichtiger Daten &uuml;ber Ihre Kontoeinstellungen</li>
        <li><strong>Recht auf L&ouml;schung</strong> (Art. 17) — L&ouml;schung Ihres Kontos und aller Daten &uuml;ber Einstellungen → Konto l&ouml;schen</li>
        <li><strong>Recht auf Einschr&auml;nkung der Verarbeitung</strong> (Art. 18) — Einschr&auml;nkung der Datenverarbeitung</li>
        <li><strong>Recht auf Daten&uuml;bertragbarkeit</strong> (Art. 20) — Erhalt Ihrer Daten in einem maschinenlesbaren Format</li>
        <li><strong>Widerspruchsrecht</strong> (Art. 21) — Widerspruch gegen die Verarbeitung auf Grundlage berechtigter Interessen</li>
        <li><strong>Recht auf Widerruf der Einwilligung</strong> (Art. 7 Abs. 3) — Benachrichtigungen jederzeit in den Einstellungen deaktivieren</li>
      </ul>
      <p>
        Zur Aus&uuml;bung Ihrer Rechte wenden Sie sich bitte an:{' '}
        <a href="mailto:oleksii@hookahtorus.com">oleksii@hookahtorus.com</a>
      </p>

      <h2>9. Beschwerderecht bei einer Aufsichtsbeh&ouml;rde</h2>
      <p>
        Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbeh&ouml;rde zu beschweren.
        Eine Liste der Aufsichtsbeh&ouml;rden in Deutschland finden Sie unter:{' '}
        <a href="https://www.bfdi.bund.de/DE/Service/Anschriften/Laender/Laender-node.html" target="_blank" rel="noopener noreferrer">
          bfdi.bund.de
        </a>
      </p>

      <h2>10. &Auml;nderungen dieser Datenschutzerkl&auml;rung</h2>
      <p>
        Wir behalten uns das Recht vor, diese Datenschutzerkl&auml;rung zu aktualisieren.
        Bei wesentlichen &Auml;nderungen werden die Nutzer per E-Mail informiert.
        Die aktuelle Fassung ist stets unter hookahtorus.com/legal/privacy abrufbar.
      </p>

      <h2>11. Kontakt</h2>
      <p>
        Bei Fragen zur Verarbeitung personenbezogener Daten:<br />
        E-Mail: <a href="mailto:oleksii@hookahtorus.com">oleksii@hookahtorus.com</a>
      </p>
    </article>
  )
}

export default function PrivacyContent() {
  const { locale } = useLocale()

  if (locale === 'en') return <EnPrivacy />
  if (locale === 'de') return <DePrivacy />
  return <RuPrivacy />
}
