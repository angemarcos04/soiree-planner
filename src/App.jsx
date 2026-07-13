import { useEffect, useState } from 'react';
import {
  MAX_CONFIRMED_ATTENDEES,
  OPENING_NIGHT_GOLDEN_HOUR,
  soireeNights,
  guests,
} from './data';

function hasPlusOne(guest) {
  return guest.plusOne.trim() !== '' && guest.plusOne !== 'No plus-one';
}

function getPartySize(guest) {
  return 1 + Number(hasPlusOne(guest));
}

function countConfirmedAttendees(guestList) {
  return guestList
    .filter((guest) => guest.rsvp === 'Confirmed')
    .reduce((total, guest) => total + getPartySize(guest), 0);
}

function getTimeLeft(target) {
  const now = new Date();
  const end = new Date(target);
  const distance = end.getTime() - now.getTime();

  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  return { days, hours, minutes, seconds, isComplete: false };
}

function Countdown({ target }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);

    setTimeLeft(getTimeLeft(target));

    return () => window.clearInterval(interval);
  }, [target]);

  if (timeLeft.isComplete) {
    return (
      <p className="golden-hour-state" aria-live="polite">
        Golden hour has begun.
      </p>
    );
  }

  return (
    <div className="countdown-grid" aria-live="polite" aria-label="Countdown to golden hour">
      <TimeUnit value={timeLeft.days} label="Days" />
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <TimeUnit value={timeLeft.minutes} label="Minutes" />
      <TimeUnit value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}

function TimeUnit({ value, label }) {
  return (
    <div className="countdown-unit">
      <strong>{String(value).padStart(2, '0')}</strong>
      <span>{label}</span>
    </div>
  );
}

function GuestItem({ guest }) {
  const statusClass = guest.rsvp.toLowerCase().replaceAll(' ', '-');

  return (
    <li className='guest-item'>
      <div>
        <h3>{guest.name}</h3>
        <p className='guest-meta'>
          RSVP: <span className={`status-badge status-${statusClass}`}>{guest.rsvp}</span>
        </p>
      </div>
      <p className='plus-one'>{guest.plusOne}</p>
    </li>
  );
}

function App() {
  const [guestList, setGuestList] = useState(guests);
  const [submissionMessage, setSubmissionMessage] = useState('');

  const confirmedAttendeeCount = countConfirmedAttendees(guestList);
  const spotsRemaining = Math.max(MAX_CONFIRMED_ATTENDEES - confirmedAttendeeCount, 0);
  const confirmedAndOtherGuests = guestList.filter((guest) => guest.rsvp !== 'Waitlisted');
  const waitlistedGuests = guestList.filter((guest) => guest.rsvp === 'Waitlisted');

  function handleRsvpSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name').trim();
    const response = formData.get('response');
    const plusOneName = formData.get('plusOne').trim();
    const plusOne = plusOneName || 'No plus-one';
    const partySize = 1 + Number(plusOneName !== '');

    let rsvp = 'Regrets';
    if (response === 'attending') {
      rsvp = partySize <= spotsRemaining ? 'Confirmed' : 'Waitlisted';
    }

    setGuestList((currentGuests) => [
      ...currentGuests,
      { name, rsvp, plusOne },
    ]);

    if (rsvp === 'Confirmed') {
      setSubmissionMessage(`${name}'s party is confirmed.`);
    } else if (rsvp === 'Waitlisted') {
      setSubmissionMessage(`${name}'s entire party was added to the waitlist.`);
    } else {
      setSubmissionMessage(`${name}'s regrets were recorded.`);
    }

    form.reset();
  }

  return (
    <main className="page-shell">
      <section className="hero card">
        <div className="string-lights" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <p className="eyebrow">Summer soirée planner</p>
        <h1>Three nights, one warm glow, and everything in view.</h1>
        <p className="lead">
          A simple dashboard for the opening weekend, the guest list, and the exact moment golden hour arrives.
        </p>
        <dl className="event-meta" aria-label="Opening night details">
          <div>
            <dt>Opening night</dt>
            <dd>Saturday, August 15, 2026</dd>
          </div>
          <div>
            <dt>Golden hour</dt>
            <dd>6:30 PM</dd>
          </div>
        </dl>
        <div className="countdown-panel">
          <h2>Countdown to golden hour</h2>
          <Countdown target={OPENING_NIGHT_GOLDEN_HOUR} />
        </div>
      </section>

      <section className="dashboard-grid" aria-label="Soirée dashboard">
        <article className="card">
          <h2>Three-night plan</h2>
          <div className="night-list">
            {soireeNights.map((night) => (
              <article className="night-card" key={night.label}>
                <p className="night-label">{night.label}</p>
                <h3>{night.theme}</h3>
                <p>
                  <time dateTime={night.isoDateTime}>{night.date}</time>
                </p>
                <p>{night.time}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Guest list</h2>
          <div className='capacity-summary' aria-live='polite'>
            <strong>{spotsRemaining} spots remaining</strong>
            <span>{confirmedAttendeeCount} of {MAX_CONFIRMED_ATTENDEES} attendees confirmed</span>
          </div>

          <form className='rsvp-form' onSubmit={handleRsvpSubmit}>
            <h3>RSVP</h3>
            <p className='section-copy'>Add your response and optional plus-one.</p>

            <label htmlFor='guest-name'>Guest name</label>
            <input id='guest-name' name='name' type='text' autoComplete='name' required />

            <fieldset>
              <legend>Will you attend?</legend>
              <label className='radio-option'>
                <input name='response' type='radio' value='attending' defaultChecked />
                Attending
              </label>
              <label className='radio-option'>
                <input name='response' type='radio' value='regrets' />
                Regrets
              </label>
            </fieldset>

            <label htmlFor='plus-one-name'>Plus-one name <span>(optional)</span></label>
            <input id='plus-one-name' name='plusOne' type='text' autoComplete='off' />

            <button type='submit'>Submit RSVP</button>
          </form>

          {submissionMessage && (
            <p className='submission-message' role='status'>{submissionMessage}</p>
          )}

          <section className='waitlist-section' aria-labelledby='waitlist-heading'>
            <h3 id='waitlist-heading'>Waitlist</h3>
            {waitlistedGuests.length > 0 ? (
              <ul className='guest-list'>
                {waitlistedGuests.map((guest, index) => (
                  <GuestItem key={`${guest.name}-${index}`} guest={guest} />
                ))}
              </ul>
            ) : (
              <p className='empty-state'>No one is waiting for a spot.</p>
            )}
          </section>

          <h3 className='list-heading'>Guest responses</h3>
          <p className="section-copy">Sample guests with RSVP status and plus-one details.</p>
          <ul className="guest-list">
            {confirmedAndOtherGuests.map((guest, index) => (
              <GuestItem key={`${guest.name}-${index}`} guest={guest} />
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Signature drinks</h2>
          <p className="section-copy">Exactly one drink for each of the three nights.</p>
          <ol className="drink-list">
            {soireeNights.map((night) => (
              <li key={night.label} className="drink-item">
                <span>{night.theme}</span>
                <strong>{night.drink}</strong>
              </li>
            ))}
          </ol>
        </article>
      </section>
    </main>
  );
}

export default App;
