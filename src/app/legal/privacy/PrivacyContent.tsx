'use client'

import { useLocale } from '@/lib/i18n'

function RuPrivacy() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Политика конфиденциальности</h1>
      <p className="text-[var(--color-textMuted)]">Дата вступления в силу: 1 февраля 2026 г.</p>

      <h2>1. Общие положения</h2>
      <p>
        Настоящая Политика конфиденциальности описывает, как Hookah Torus (&laquo;Сервис&raquo;, &laquo;мы&raquo;)
        собирает, использует и защищает персональные данные пользователей (&laquo;вы&raquo;, &laquo;Пользователь&raquo;)
        при использовании веб-приложения hookah-torus.com и связанных с ним сервисов.
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
        <li>IP-адрес и данные браузера</li>
        <li>Cookies для поддержания сессии авторизации</li>
        <li>Данные об использовании Сервиса (просмотры страниц, действия)</li>
      </ul>
      <h3>2.3. Платёжные данные</h3>
      <p>
        Оплата обрабатывается через Stripe. Мы не храним данные банковских карт.
        Stripe обрабатывает платежи в соответствии со стандартом PCI DSS.
      </p>

      <h2>3. Цели обработки данных</h2>
      <ul>
        <li>Предоставление и поддержка функциональности Сервиса</li>
        <li>Аутентификация и управление доступом</li>
        <li>Обработка платежей и управление подписками</li>
        <li>Отправка уведомлений (email, push, Telegram) по вашему выбору</li>
        <li>Улучшение Сервиса на основе агрегированной статистики использования</li>
      </ul>

      <h2>4. Хранение и защита данных</h2>
      <p>
        Данные хранятся на серверах Supabase (инфраструктура AWS, регион EU).
        Передача данных шифруется с использованием TLS.
        Доступ к базе данных ограничен политиками Row Level Security (RLS).
      </p>

      <h2>5. Передача данных третьим лицам</h2>
      <p>Мы не продаём и не передаём ваши персональные данные третьим лицам, за исключением:</p>
      <ul>
        <li><strong>Supabase</strong> — хостинг базы данных и аутентификация</li>
        <li><strong>Stripe</strong> — обработка платежей</li>
        <li><strong>Resend</strong> — отправка email-уведомлений (если включено)</li>
        <li><strong>Vercel</strong> — хостинг веб-приложения</li>
      </ul>

      <h2>6. Ваши права</h2>
      <p>Вы имеете право:</p>
      <ul>
        <li>Запросить доступ к своим персональным данным</li>
        <li>Исправить или обновить свои данные через личный кабинет</li>
        <li>Удалить свой аккаунт и все связанные данные</li>
        <li>Отключить email- и push-уведомления в настройках</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>
        Мы используем только функциональные cookies для поддержания сессии авторизации.
        Мы не используем рекламные или отслеживающие cookies.
      </p>

      <h2>8. Изменения политики</h2>
      <p>
        Мы оставляем за собой право обновлять данную Политику. При существенных изменениях
        пользователи будут уведомлены через email или уведомление в Сервисе.
      </p>

      <h2>9. Контакты</h2>
      <p>
        По вопросам, связанным с обработкой персональных данных, обращайтесь
        по адресу: <a href="mailto:privacy@hookah-torus.com">privacy@hookah-torus.com</a>
      </p>
    </article>
  )
}

function EnPrivacy() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-[var(--color-textMuted)]">Effective date: February 1, 2026</p>

      <h2>1. General Provisions</h2>
      <p>
        This Privacy Policy describes how Hookah Torus (&ldquo;Service&rdquo;, &ldquo;we&rdquo;)
        collects, uses, and protects the personal data of users (&ldquo;you&rdquo;, &ldquo;User&rdquo;)
        when using the hookah-torus.com web application and related services.
      </p>

      <h2>2. Data We Collect</h2>
      <h3>2.1. Data Provided by You</h3>
      <ul>
        <li>Email address and password upon registration</li>
        <li>Venue name and owner name</li>
        <li>Phone number and address (optional)</li>
        <li>Inventory, session, mix, and guest data entered by you into the system</li>
      </ul>
      <h3>2.2. Data Collected Automatically</h3>
      <ul>
        <li>IP address and browser information</li>
        <li>Cookies to maintain authentication sessions</li>
        <li>Service usage data (page views, actions)</li>
      </ul>
      <h3>2.3. Payment Data</h3>
      <p>
        Payments are processed through Stripe. We do not store credit card information.
        Stripe processes payments in accordance with PCI DSS standards.
      </p>

      <h2>3. Purposes of Data Processing</h2>
      <ul>
        <li>Providing and supporting the functionality of the Service</li>
        <li>Authentication and access management</li>
        <li>Processing payments and managing subscriptions</li>
        <li>Sending notifications (email, push, Telegram) based on your preferences</li>
        <li>Improving the Service based on aggregated usage statistics</li>
      </ul>

      <h2>4. Data Storage and Security</h2>
      <p>
        Data is stored on Supabase servers (AWS infrastructure, EU region).
        Data transmission is encrypted using TLS.
        Database access is restricted by Row Level Security (RLS) policies.
      </p>

      <h2>5. Disclosure of Data to Third Parties</h2>
      <p>We do not sell or share your personal data with third parties, except for:</p>
      <ul>
        <li><strong>Supabase</strong> &mdash; database hosting and authentication</li>
        <li><strong>Stripe</strong> &mdash; payment processing</li>
        <li><strong>Resend</strong> &mdash; email notifications (if enabled)</li>
        <li><strong>Vercel</strong> &mdash; web application hosting</li>
      </ul>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Request access to your personal data</li>
        <li>Correct or update your data through your account settings</li>
        <li>Delete your account and all associated data</li>
        <li>Disable email and push notifications in your settings</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>
        We use only functional cookies to maintain authentication sessions.
        We do not use advertising or tracking cookies.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We reserve the right to update this Policy. In the event of material changes,
        users will be notified via email or an in-app notification.
      </p>

      <h2>9. Contact Information</h2>
      <p>
        For questions regarding the processing of personal data, please contact us
        at: <a href="mailto:privacy@hookah-torus.com">privacy@hookah-torus.com</a>
      </p>
    </article>
  )
}

function DePrivacy() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Datenschutzerkl&auml;rung</h1>
      <p className="text-[var(--color-textMuted)]">G&uuml;ltig ab: 1. Februar 2026</p>

      <h2>1. Allgemeine Bestimmungen</h2>
      <p>
        Diese Datenschutzerkl&auml;rung beschreibt, wie Hookah Torus (&bdquo;Dienst&ldquo;, &bdquo;wir&ldquo;)
        personenbezogene Daten der Nutzer (&bdquo;Sie&ldquo;, &bdquo;Nutzer&ldquo;)
        bei der Nutzung der Webanwendung hookah-torus.com und der damit verbundenen Dienste
        erhebt, verwendet und sch&uuml;tzt.
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
        <li>IP-Adresse und Browserinformationen</li>
        <li>Cookies zur Aufrechterhaltung der Authentifizierungssitzung</li>
        <li>Nutzungsdaten des Dienstes (Seitenaufrufe, Aktionen)</li>
      </ul>
      <h3>2.3. Zahlungsdaten</h3>
      <p>
        Zahlungen werden &uuml;ber Stripe abgewickelt. Wir speichern keine Kreditkartendaten.
        Stripe verarbeitet Zahlungen gem&auml;&szlig; dem PCI-DSS-Standard.
      </p>

      <h2>3. Zwecke der Datenverarbeitung</h2>
      <ul>
        <li>Bereitstellung und Aufrechterhaltung der Funktionalit&auml;t des Dienstes</li>
        <li>Authentifizierung und Zugriffsverwaltung</li>
        <li>Zahlungsabwicklung und Abonnementverwaltung</li>
        <li>Versand von Benachrichtigungen (E-Mail, Push, Telegram) gem&auml;&szlig; Ihren Einstellungen</li>
        <li>Verbesserung des Dienstes auf Grundlage aggregierter Nutzungsstatistiken</li>
      </ul>

      <h2>4. Datenspeicherung und Sicherheit</h2>
      <p>
        Die Daten werden auf Supabase-Servern gespeichert (AWS-Infrastruktur, Region EU).
        Die Daten&uuml;bertragung wird mittels TLS verschl&uuml;sselt.
        Der Datenbankzugriff ist durch Row-Level-Security-Richtlinien (RLS) beschr&auml;nkt.
      </p>

      <h2>5. Weitergabe von Daten an Dritte</h2>
      <p>Wir verkaufen oder &uuml;bermitteln Ihre personenbezogenen Daten nicht an Dritte, mit Ausnahme von:</p>
      <ul>
        <li><strong>Supabase</strong> &mdash; Datenbank-Hosting und Authentifizierung</li>
        <li><strong>Stripe</strong> &mdash; Zahlungsabwicklung</li>
        <li><strong>Resend</strong> &mdash; E-Mail-Benachrichtigungen (sofern aktiviert)</li>
        <li><strong>Vercel</strong> &mdash; Hosting der Webanwendung</li>
      </ul>

      <h2>6. Ihre Rechte</h2>
      <p>Sie haben das Recht:</p>
      <ul>
        <li>Auskunft &uuml;ber Ihre personenbezogenen Daten zu verlangen</li>
        <li>Ihre Daten &uuml;ber Ihre Kontoeinstellungen zu berichtigen oder zu aktualisieren</li>
        <li>Ihr Benutzerkonto und alle damit verbundenen Daten zu l&ouml;schen</li>
        <li>E-Mail- und Push-Benachrichtigungen in den Einstellungen zu deaktivieren</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>
        Wir verwenden ausschlie&szlig;lich funktionale Cookies zur Aufrechterhaltung der Authentifizierungssitzung.
        Wir verwenden keine Werbe- oder Tracking-Cookies.
      </p>

      <h2>8. &Auml;nderungen dieser Datenschutzerkl&auml;rung</h2>
      <p>
        Wir behalten uns das Recht vor, diese Datenschutzerkl&auml;rung zu aktualisieren.
        Bei wesentlichen &Auml;nderungen werden die Nutzer per E-Mail oder durch eine
        Benachrichtigung im Dienst informiert.
      </p>

      <h2>9. Kontakt</h2>
      <p>
        Bei Fragen zur Verarbeitung personenbezogener Daten wenden Sie sich bitte an:{' '}
        <a href="mailto:privacy@hookah-torus.com">privacy@hookah-torus.com</a>
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
