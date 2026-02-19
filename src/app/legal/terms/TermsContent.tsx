'use client'

import { useLocale } from '@/lib/i18n'

function RuTerms() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Условия использования</h1>
      <p className="text-[var(--color-textMuted)]">Дата вступления в силу: 1 февраля 2026 г.</p>

      <h2>1. Общие положения</h2>
      <p>
        Настоящие Условия использования (&laquo;Условия&raquo;) регулируют использование
        веб-приложения Hookah Torus (&laquo;Сервис&raquo;), расположенного по адресу hookah-torus.com.
        Регистрируясь и используя Сервис, вы соглашаетесь с настоящими Условиями.
      </p>

      <h2>2. Описание сервиса</h2>
      <p>
        Hookah Torus — B2B SaaS-платформа для управления кальянными заведениями, включающая:
      </p>
      <ul>
        <li>Учёт инвентаря табака</li>
        <li>Калькулятор миксов с AI-рекомендациями</li>
        <li>Управление сессиями и гостевой базой</li>
        <li>Аналитику и статистику</li>
        <li>Маркетплейс поставщиков</li>
        <li>Управление командой</li>
      </ul>

      <h2>3. Регистрация и аккаунт</h2>
      <ul>
        <li>Для использования Сервиса необходимо создать аккаунт с действующим email-адресом.</li>
        <li>Вы несёте ответственность за сохранность пароля и действия, совершённые под вашим аккаунтом.</li>
        <li>Один аккаунт соответствует одному заведению. Для нескольких заведений требуются отдельные аккаунты.</li>
      </ul>

      <h2>4. Тарифные планы и оплата</h2>
      <h3>4.1. Бесплатный тариф</h3>
      <p>
        Включает ограниченный функционал: до 20 позиций в инвентаре, 3 типа чаш,
        история за 30 дней, базовая статистика.
      </p>
      <h3>4.2. Платные тарифы (Pro, Enterprise)</h3>
      <ul>
        <li>Оплата производится через Stripe ежемесячно или ежегодно.</li>
        <li>Подписка продлевается автоматически до отмены.</li>
        <li>Отмена подписки вступает в силу по окончании текущего оплаченного периода.</li>
        <li>Возврат средств за неиспользованный период не производится.</li>
      </ul>

      <h2>5. Правила использования</h2>
      <p>Запрещается:</p>
      <ul>
        <li>Использовать Сервис для незаконной деятельности</li>
        <li>Пытаться получить несанкционированный доступ к данным других пользователей</li>
        <li>Создавать автоматические запросы, перегружающие Сервис</li>
        <li>Перепродавать доступ к Сервису без нашего письменного согласия</li>
      </ul>

      <h2>6. Интеллектуальная собственность</h2>
      <p>
        Все права на программный код, дизайн и контент Сервиса принадлежат Hookah Torus.
        Данные, внесённые пользователем (инвентарь, миксы, гостевая база),
        остаются собственностью пользователя.
      </p>

      <h2>7. Ограничение ответственности</h2>
      <ul>
        <li>Сервис предоставляется &laquo;как есть&raquo; (as is).</li>
        <li>Мы не гарантируем бесперебойную работу Сервиса.</li>
        <li>Мы не несём ответственности за убытки, связанные с перебоями в работе или потерей данных.</li>
        <li>Мы предпринимаем разумные меры для обеспечения сохранности данных, но рекомендуем регулярно экспортировать важные данные.</li>
      </ul>

      <h2>8. Прекращение использования</h2>
      <p>
        Вы можете удалить свой аккаунт в любой момент через настройки.
        Мы оставляем за собой право заблокировать аккаунт при нарушении настоящих Условий.
        При удалении аккаунта все данные удаляются безвозвратно.
      </p>

      <h2>9. Изменения условий</h2>
      <p>
        Мы оставляем за собой право обновлять настоящие Условия. При существенных изменениях
        пользователи будут уведомлены через email. Продолжение использования Сервиса после
        уведомления означает согласие с обновлёнными Условиями.
      </p>

      <h2>10. Контакты</h2>
      <p>
        По любым вопросам обращайтесь по адресу:{' '}
        <a href="mailto:support@hookah-torus.com">support@hookah-torus.com</a>
      </p>
    </article>
  )
}

function EnTerms() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Terms of Service</h1>
      <p className="text-[var(--color-textMuted)]">Effective date: February 1, 2026</p>

      <h2>1. General Provisions</h2>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern the use of the Hookah Torus
        web application (&ldquo;Service&rdquo;), accessible at hookah-torus.com.
        By registering for and using the Service, you agree to be bound by these Terms.
      </p>

      <h2>2. Description of the Service</h2>
      <p>
        Hookah Torus is a B2B SaaS platform for hookah lounge management, which includes:
      </p>
      <ul>
        <li>Tobacco inventory tracking</li>
        <li>Mix calculator with AI-powered recommendations</li>
        <li>Session management and guest database</li>
        <li>Analytics and reporting</li>
        <li>Supplier marketplace</li>
        <li>Team management</li>
      </ul>

      <h2>3. Registration and Account</h2>
      <ul>
        <li>To use the Service, you must create an account with a valid email address.</li>
        <li>You are responsible for maintaining the security of your password and for all activities that occur under your account.</li>
        <li>One account corresponds to one venue. Separate accounts are required for multiple venues.</li>
      </ul>

      <h2>4. Subscription Plans and Payment</h2>
      <h3>4.1. Free Plan</h3>
      <p>
        Includes limited functionality: up to 20 inventory items, 3 bowl types,
        30-day history, and basic analytics.
      </p>
      <h3>4.2. Paid Plans (Pro, Enterprise)</h3>
      <ul>
        <li>Payment is processed via Stripe on a monthly or annual basis.</li>
        <li>Subscriptions renew automatically until cancelled.</li>
        <li>Cancellation takes effect at the end of the current billing period.</li>
        <li>No refunds are issued for unused portions of a billing period.</li>
      </ul>

      <h2>5. Acceptable Use</h2>
      <p>You may not:</p>
      <ul>
        <li>Use the Service for any unlawful purpose</li>
        <li>Attempt to gain unauthorized access to other users&apos; data</li>
        <li>Generate automated requests that place an undue burden on the Service</li>
        <li>Resell access to the Service without our prior written consent</li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>
        All rights to the software code, design, and content of the Service belong to Hookah Torus.
        Data entered by the user (inventory, mixes, guest database) remains the property of the user.
      </p>

      <h2>7. Limitation of Liability</h2>
      <ul>
        <li>The Service is provided &ldquo;as is&rdquo; without warranties of any kind.</li>
        <li>We do not guarantee uninterrupted availability of the Service.</li>
        <li>We shall not be liable for any damages arising from service interruptions or data loss.</li>
        <li>We take reasonable measures to ensure data integrity but recommend that you regularly export important data.</li>
      </ul>

      <h2>8. Termination</h2>
      <p>
        You may delete your account at any time through your account settings.
        We reserve the right to suspend or terminate your account if you violate these Terms.
        Upon account deletion, all associated data is permanently removed.
      </p>

      <h2>9. Changes to These Terms</h2>
      <p>
        We reserve the right to update these Terms. In the event of material changes,
        users will be notified via email. Continued use of the Service following
        such notification constitutes acceptance of the updated Terms.
      </p>

      <h2>10. Contact Information</h2>
      <p>
        For any questions, please contact us at:{' '}
        <a href="mailto:support@hookah-torus.com">support@hookah-torus.com</a>
      </p>
    </article>
  )
}

function DeTerms() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Allgemeine Gesch&auml;ftsbedingungen</h1>
      <p className="text-[var(--color-textMuted)]">G&uuml;ltig ab: 1. Februar 2026</p>

      <h2>1. Allgemeine Bestimmungen</h2>
      <p>
        Diese Allgemeinen Gesch&auml;ftsbedingungen (&bdquo;AGB&ldquo;) regeln die Nutzung
        der Webanwendung Hookah Torus (&bdquo;Dienst&ldquo;), erreichbar unter hookah-torus.com.
        Mit der Registrierung und Nutzung des Dienstes erkl&auml;ren Sie sich mit diesen AGB einverstanden.
      </p>

      <h2>2. Beschreibung des Dienstes</h2>
      <p>
        Hookah Torus ist eine B2B-SaaS-Plattform f&uuml;r das Management von Shisha-Lounges, die Folgendes umfasst:
      </p>
      <ul>
        <li>Verwaltung des Tabakbestands</li>
        <li>Mischungsrechner mit KI-gest&uuml;tzten Empfehlungen</li>
        <li>Sitzungsverwaltung und G&auml;stedatenbank</li>
        <li>Analysen und Statistiken</li>
        <li>Lieferanten-Marktplatz</li>
        <li>Teamverwaltung</li>
      </ul>

      <h2>3. Registrierung und Benutzerkonto</h2>
      <ul>
        <li>Zur Nutzung des Dienstes m&uuml;ssen Sie ein Benutzerkonto mit einer g&uuml;ltigen E-Mail-Adresse erstellen.</li>
        <li>Sie sind f&uuml;r die Sicherheit Ihres Passworts und f&uuml;r alle unter Ihrem Konto durchgef&uuml;hrten Aktivit&auml;ten verantwortlich.</li>
        <li>Ein Benutzerkonto entspricht einem Standort. F&uuml;r mehrere Standorte sind separate Benutzerkonten erforderlich.</li>
      </ul>

      <h2>4. Tarife und Zahlung</h2>
      <h3>4.1. Kostenloser Tarif</h3>
      <p>
        Umfasst eingeschr&auml;nkte Funktionen: bis zu 20 Bestandspositionen, 3 Kopftypen,
        30-Tage-Verlauf und grundlegende Statistiken.
      </p>
      <h3>4.2. Kostenpflichtige Tarife (Pro, Enterprise)</h3>
      <ul>
        <li>Die Zahlung erfolgt &uuml;ber Stripe auf monatlicher oder j&auml;hrlicher Basis.</li>
        <li>Abonnements verl&auml;ngern sich automatisch bis zur K&uuml;ndigung.</li>
        <li>Die K&uuml;ndigung wird zum Ende des aktuellen Abrechnungszeitraums wirksam.</li>
        <li>Eine R&uuml;ckerstattung f&uuml;r nicht genutzte Zeitr&auml;ume erfolgt nicht.</li>
      </ul>

      <h2>5. Nutzungsrichtlinien</h2>
      <p>Es ist untersagt:</p>
      <ul>
        <li>Den Dienst f&uuml;r rechtswidrige Zwecke zu nutzen</li>
        <li>Unbefugten Zugriff auf Daten anderer Nutzer zu erlangen oder dies zu versuchen</li>
        <li>Automatisierte Anfragen zu erzeugen, die den Dienst &uuml;berm&auml;&szlig;ig belasten</li>
        <li>Den Zugang zum Dienst ohne unsere vorherige schriftliche Zustimmung weiterzuverkaufen</li>
      </ul>

      <h2>6. Geistiges Eigentum</h2>
      <p>
        Alle Rechte am Programmcode, Design und Inhalt des Dienstes liegen bei Hookah Torus.
        Die vom Nutzer eingegebenen Daten (Bestand, Mischungen, G&auml;stedatenbank)
        verbleiben im Eigentum des Nutzers.
      </p>

      <h2>7. Haftungsbeschr&auml;nkung</h2>
      <ul>
        <li>Der Dienst wird &bdquo;wie besehen&ldquo; (as is) ohne jegliche Gew&auml;hrleistung bereitgestellt.</li>
        <li>Wir garantieren keine ununterbrochene Verf&uuml;gbarkeit des Dienstes.</li>
        <li>Wir haften nicht f&uuml;r Sch&auml;den, die durch Dienstunterbrechungen oder Datenverlust entstehen.</li>
        <li>Wir ergreifen angemessene Ma&szlig;nahmen zur Sicherung der Daten, empfehlen jedoch, wichtige Daten regelm&auml;&szlig;ig zu exportieren.</li>
      </ul>

      <h2>8. K&uuml;ndigung</h2>
      <p>
        Sie k&ouml;nnen Ihr Benutzerkonto jederzeit &uuml;ber die Kontoeinstellungen l&ouml;schen.
        Wir behalten uns das Recht vor, Ihr Konto bei Versto&szlig; gegen diese AGB zu sperren oder zu k&uuml;ndigen.
        Bei L&ouml;schung des Kontos werden alle zugeh&ouml;rigen Daten unwiderruflich entfernt.
      </p>

      <h2>9. &Auml;nderungen der AGB</h2>
      <p>
        Wir behalten uns das Recht vor, diese AGB zu aktualisieren. Bei wesentlichen &Auml;nderungen
        werden die Nutzer per E-Mail benachrichtigt. Die weitere Nutzung des Dienstes nach
        einer solchen Benachrichtigung gilt als Zustimmung zu den aktualisierten AGB.
      </p>

      <h2>10. Kontakt</h2>
      <p>
        Bei Fragen wenden Sie sich bitte an:{' '}
        <a href="mailto:support@hookah-torus.com">support@hookah-torus.com</a>
      </p>
    </article>
  )
}

export default function TermsContent() {
  const { locale } = useLocale()

  if (locale === 'en') return <EnTerms />
  if (locale === 'de') return <DeTerms />
  return <RuTerms />
}
