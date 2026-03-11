'use client'

import { useLocale } from '@/lib/i18n'

function DeWiderruf() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Widerrufsbelehrung</h1>
      <p className="text-[var(--color-textMuted)]">Stand: 1. März 2026</p>

      <h2>1. Widerrufsrecht</h2>
      <p>
        Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
        Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
      </p>
      <p>
        Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
      </p>
      <p>
        Oleksii Yagich<br />
        Hookah Torus<br />
        E-Mail: <a href="mailto:htorus@hookahtorus.com">htorus@hookahtorus.com</a>
      </p>
      <p>
        mittels einer eindeutigen Erklärung (z.&nbsp;B. ein mit der Post versandter Brief oder E-Mail)
        über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte
        Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
      </p>
      <p>
        Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des
        Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
      </p>

      <h2>2. Folgen des Widerrufs</h2>
      <p>
        Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten
        haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus
        ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste
        Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
        zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
      </p>
      <p>
        Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen
        Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart;
        in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
      </p>

      <h2>3. Vorzeitiges Erlöschen des Widerrufsrechts bei digitalen Inhalten</h2>
      <p>
        Das Widerrufsrecht erlischt vorzeitig, wenn wir mit der Ausführung des Vertrags begonnen haben,
        nachdem Sie ausdrücklich zugestimmt haben, dass wir mit der Ausführung des Vertrags vor Ablauf
        der Widerrufsfrist beginnen, und Sie Ihre Kenntnis davon bestätigt haben, dass Sie durch Ihre
        Zustimmung mit Beginn der Ausführung des Vertrags Ihr Widerrufsrecht verlieren (§ 356 Abs. 5 BGB).
      </p>
      <p>
        Bei der Bestellung eines Abonnements von Hookah Torus werden Sie vor Abschluss der Bestellung
        aufgefordert, dieser vorzeitigen Ausführung ausdrücklich zuzustimmen und den Verlust des
        Widerrufsrechts zur Kenntnis zu nehmen.
      </p>

      <h2>4. Muster-Widerrufsformular</h2>
      <p>
        (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden
        Sie es zurück.)
      </p>
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-6 my-4">
        <p>An:</p>
        <p>
          Oleksii Yagich<br />
          Hookah Torus<br />
          E-Mail: htorus@hookahtorus.com
        </p>
        <p>
          Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die
          Erbringung der folgenden Dienstleistung (*):
        </p>
        <p>_______________________________________________</p>
        <p>Bestellt am (*) / erhalten am (*):</p>
        <p>_______________________________________________</p>
        <p>Name des/der Verbraucher(s):</p>
        <p>_______________________________________________</p>
        <p>Anschrift des/der Verbraucher(s):</p>
        <p>_______________________________________________</p>
        <p>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):</p>
        <p>_______________________________________________</p>
        <p>Datum:</p>
        <p>_______________________________________________</p>
        <p className="text-sm text-[var(--color-textMuted)]">(*) Unzutreffendes streichen.</p>
      </div>
    </article>
  )
}

function EnWiderruf() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Right of Withdrawal</h1>
      <p className="text-[var(--color-textMuted)]">Effective date: March 1, 2026</p>

      <h2>1. Right of Withdrawal</h2>
      <p>
        You have the right to withdraw from this contract within fourteen days without giving any reason.
        The withdrawal period is fourteen days from the date of the conclusion of the contract.
      </p>
      <p>
        To exercise the right of withdrawal, you must inform us:
      </p>
      <p>
        Oleksii Yagich<br />
        Hookah Torus<br />
        Email: <a href="mailto:htorus@hookahtorus.com">htorus@hookahtorus.com</a>
      </p>
      <p>
        of your decision to withdraw from this contract by an unequivocal statement (e.g., a letter sent
        by post or email). You may use the attached model withdrawal form, but it is not obligatory.
      </p>

      <h2>2. Effects of Withdrawal</h2>
      <p>
        If you withdraw from this contract, we shall reimburse to you all payments received from you,
        without undue delay and in any event not later than fourteen days from the day on which we are
        informed about your decision to withdraw from this contract. We shall carry out such reimbursement
        using the same means of payment as you used for the initial transaction, unless you have expressly
        agreed otherwise; in any event, you will not incur any fees as a result of such reimbursement.
      </p>

      <h2>3. Early Expiry of the Right of Withdrawal for Digital Content</h2>
      <p>
        The right of withdrawal expires prematurely if we have begun to execute the contract after you
        have expressly agreed that we may begin execution before the expiry of the withdrawal period, and
        you have confirmed your acknowledgment that you lose your right of withdrawal upon commencement of
        execution (§ 356(5) BGB).
      </p>
      <p>
        When ordering a Hookah Torus subscription, you will be asked to expressly consent to this early
        execution and acknowledge the loss of your right of withdrawal before completing your order.
      </p>

      <h2>4. Model Withdrawal Form</h2>
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-6 my-4">
        <p>To: Oleksii Yagich, Hookah Torus, Email: htorus@hookahtorus.com</p>
        <p>I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the following service (*):</p>
        <p>Ordered on (*) / received on (*):</p>
        <p>Name of consumer(s):</p>
        <p>Address of consumer(s):</p>
        <p>Signature of consumer(s) (only for paper communication):</p>
        <p>Date:</p>
        <p className="text-sm text-[var(--color-textMuted)]">(*) Delete as appropriate.</p>
      </div>
    </article>
  )
}

function RuWiderruf() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Право на отзыв (Widerrufsbelehrung)</h1>
      <p className="text-[var(--color-textMuted)]">Дата вступления в силу: 1 марта 2026 г.</p>

      <h2>1. Право на отзыв</h2>
      <p>
        Вы имеете право отказаться от настоящего договора в течение четырнадцати дней без указания причин.
        Срок для отзыва составляет четырнадцать дней с момента заключения договора.
      </p>
      <p>Для реализации права на отзыв вы должны уведомить нас:</p>
      <p>
        Oleksii Yagich<br />
        Hookah Torus<br />
        E-Mail: <a href="mailto:htorus@hookahtorus.com">htorus@hookahtorus.com</a>
      </p>
      <p>
        посредством однозначного заявления (например, письмо по почте или электронная почта) о вашем
        решении отказаться от договора.
      </p>

      <h2>2. Последствия отзыва</h2>
      <p>
        В случае отзыва мы возвращаем вам все полученные от вас платежи не позднее четырнадцати дней
        со дня получения уведомления об отзыве. Возврат осуществляется тем же способом оплаты, который
        вы использовали при первоначальной транзакции.
      </p>

      <h2>3. Досрочное прекращение права на отзыв</h2>
      <p>
        Право на отзыв прекращается досрочно, если мы начали исполнение договора после того, как вы
        дали явное согласие на начало исполнения до истечения срока отзыва и подтвердили, что осознаёте
        утрату права на отзыв (§ 356 абз. 5 BGB).
      </p>
      <p>
        При оформлении подписки на Hookah Torus вам будет предложено дать такое согласие перед
        завершением заказа.
      </p>

      <h2>4. Образец формы отзыва</h2>
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-6 my-4">
        <p>Кому: Oleksii Yagich, Hookah Torus, Email: htorus@hookahtorus.com</p>
        <p>Настоящим я/мы (*) отзываю(ем) заключённый мной/нами (*) договор на оказание следующей услуги (*):</p>
        <p>Дата заказа (*) / получения (*):</p>
        <p>Имя потребителя(ей):</p>
        <p>Адрес потребителя(ей):</p>
        <p>Подпись потребителя(ей) (только при бумажном уведомлении):</p>
        <p>Дата:</p>
        <p className="text-sm text-[var(--color-textMuted)]">(*) Ненужное зачеркнуть.</p>
      </div>
    </article>
  )
}

export default function WiderrufContent() {
  const { locale } = useLocale()

  if (locale === 'de') return <DeWiderruf />
  if (locale === 'en') return <EnWiderruf />
  return <RuWiderruf />
}
