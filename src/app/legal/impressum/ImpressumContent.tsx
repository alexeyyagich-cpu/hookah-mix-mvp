'use client'

import { useLocale } from '@/lib/i18n'

function DeImpressum() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Impressum</h1>
      <p className="text-[var(--color-textMuted)]">Angaben gem&auml;&szlig; &sect; 5 TMG</p>

      <h2>Diensteanbieter</h2>
      <p>
        Oleksii Yagich<br />
        Hookah Torus<br />
        E-Mail: <a href="mailto:oleksii@hookahtorus.com">oleksii@hookahtorus.com</a>
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href="mailto:htorus@hookahtorus.com">htorus@hookahtorus.com</a><br />
        Website: <a href="https://hookahtorus.com">hookahtorus.com</a>
      </p>

      <h2>Verantwortlich f&uuml;r den Inhalt gem&auml;&szlig; &sect; 18 Abs. 2 MStV</h2>
      <p>
        Oleksii Yagich<br />
        (Adresse wie oben)
      </p>

      <h2>EU-Streitschlichtung</h2>
      <p>
        Die Europ&auml;ische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr/
        </a>
      </p>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Haftung f&uuml;r Inhalte</h2>
      <p>
        Als Diensteanbieter sind wir gem&auml;&szlig; &sect; 7 Abs. 1 TMG f&uuml;r eigene Inhalte
        auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach &sect;&sect; 8 bis 10 TMG
        sind wir als Diensteanbieter jedoch nicht verpflichtet, &uuml;bermittelte oder gespeicherte
        fremde Informationen zu &uuml;berwachen oder nach Umst&auml;nden zu forschen, die auf eine
        rechtswidrige T&auml;tigkeit hinweisen.
      </p>

      <h2>Haftung f&uuml;r Links</h2>
      <p>
        Unser Angebot enth&auml;lt Links zu externen Websites Dritter, auf deren Inhalte wir keinen
        Einfluss haben. Deshalb k&ouml;nnen wir f&uuml;r diese fremden Inhalte auch keine Gew&auml;hr
        &uuml;bernehmen. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links
        umgehend entfernen.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
        unterliegen dem deutschen Urheberrecht. Die Vervielf&auml;ltigung, Bearbeitung,
        Verbreitung und jede Art der Verwertung au&szlig;erhalb der Grenzen des Urheberrechts
        bed&uuml;rfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
      </p>
    </article>
  )
}

function EnImpressum() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Legal Notice (Impressum)</h1>
      <p className="text-[var(--color-textMuted)]">Information pursuant to &sect; 5 TMG (German Telemedia Act)</p>

      <h2>Service Provider</h2>
      <p>
        Oleksii Yagich<br />
        Hookah Torus<br />
        Email: <a href="mailto:oleksii@hookahtorus.com">oleksii@hookahtorus.com</a>
      </p>

      <h2>Contact</h2>
      <p>
        Email: <a href="mailto:htorus@hookahtorus.com">htorus@hookahtorus.com</a><br />
        Website: <a href="https://hookahtorus.com">hookahtorus.com</a>
      </p>

      <h2>Responsible for Content pursuant to &sect; 18(2) MStV</h2>
      <p>
        Oleksii Yagich<br />
        (Address as above)
      </p>

      <h2>EU Dispute Resolution</h2>
      <p>
        The European Commission provides a platform for online dispute resolution (ODR):{' '}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr/
        </a>
      </p>
      <p>
        We are not willing or obliged to participate in dispute resolution proceedings
        before a consumer arbitration board.
      </p>

      <h2>Liability for Content</h2>
      <p>
        As a service provider, we are responsible for our own content on these pages in accordance
        with general laws pursuant to &sect; 7(1) TMG. However, pursuant to &sect;&sect; 8 to 10 TMG,
        we are not obligated to monitor transmitted or stored third-party information.
      </p>

      <h2>Liability for Links</h2>
      <p>
        Our website contains links to external third-party websites whose content we have no influence over.
        Therefore, we cannot accept any liability for this third-party content.
        If we become aware of any legal violations, we will remove such links immediately.
      </p>

      <h2>Copyright</h2>
      <p>
        The content and works created by the site operator on these pages are subject to
        German copyright law. Reproduction, editing, distribution, and any kind of use
        beyond the limits of copyright require the written consent of the respective author or creator.
      </p>
    </article>
  )
}

function RuImpressum() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Правовая информация (Impressum)</h1>
      <p className="text-[var(--color-textMuted)]">Информация согласно § 5 TMG (Закон о телемедиа Германии)</p>

      <h2>Поставщик услуг</h2>
      <p>
        Oleksii Yagich<br />
        Hookah Torus<br />
        E-Mail: <a href="mailto:oleksii@hookahtorus.com">oleksii@hookahtorus.com</a>
      </p>

      <h2>Контакт</h2>
      <p>
        E-Mail: <a href="mailto:htorus@hookahtorus.com">htorus@hookahtorus.com</a><br />
        Сайт: <a href="https://hookahtorus.com">hookahtorus.com</a>
      </p>

      <h2>Ответственный за содержание согласно § 18 абз. 2 MStV</h2>
      <p>
        Oleksii Yagich<br />
        (Адрес как указано выше)
      </p>

      <h2>Разрешение споров в ЕС</h2>
      <p>
        Европейская комиссия предоставляет платформу для онлайн-разрешения споров (ODR):{' '}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr/
        </a>
      </p>
      <p>
        Мы не обязаны и не готовы участвовать в процедурах разрешения споров
        перед органом по урегулированию потребительских споров.
      </p>

      <h2>Ответственность за содержание</h2>
      <p>
        Как поставщик услуг, мы несём ответственность за собственное содержание на этих страницах
        в соответствии с общим законодательством согласно § 7 абз. 1 TMG.
        Однако в соответствии с §§ 8-10 TMG мы не обязаны осуществлять мониторинг
        переданной или сохранённой информации третьих лиц.
      </p>

      <h2>Ответственность за ссылки</h2>
      <p>
        Наш сайт содержит ссылки на внешние веб-сайты третьих лиц, на содержание которых
        мы не имеем влияния. При обнаружении правонарушений такие ссылки будут незамедлительно удалены.
      </p>

      <h2>Авторское право</h2>
      <p>
        Содержание и произведения, созданные оператором сайта на этих страницах,
        подлежат защите авторским правом Германии. Воспроизведение, обработка,
        распространение и любое использование за пределами авторского права
        требуют письменного согласия соответствующего автора или создателя.
      </p>
    </article>
  )
}

export default function ImpressumContent() {
  const { locale } = useLocale()

  if (locale === 'en') return <EnImpressum />
  if (locale === 'de') return <DeImpressum />
  return <RuImpressum />
}
