// Public home page: what TaskBuddy does, sign-in, and the way to the Meet extension
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMobileScreen, faLaptop, faVideo, faMicrophone, faFileLines, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { signInWithGoogle } from '../firebase';
import { debugError } from '../utils/debug';
import Brand from '../components/Brand';
import '../styles/pages.css';

async function handleSignIn() {
  try {
    await signInWithGoogle();
  } catch (error) {
    debugError('Error signing in with Google:', error);
  }
}

const WAYS = [
  {
    icon: faMobileScreen,
    title: 'Op je telefoon',
    text: 'Zet TaskBuddy op je beginscherm en neem een gesprek aan tafel op met één tik.'
  },
  {
    icon: faLaptop,
    title: 'In je browser',
    text: 'Open TaskBuddy op je laptop en neem op via je microfoon. Niets te installeren.'
  },
  {
    icon: faVideo,
    title: 'Tijdens Google Meet',
    text: 'Met de Chrome-extensie neem je het hele gesprek op, ook de andere deelnemers.',
    link: { href: '/extensie', label: 'Extensie installeren' }
  }
];

const STEPS = [
  { icon: faMicrophone, title: 'Opnemen', text: 'Start de opname op je telefoon, laptop of in Meet.' },
  { icon: faFileLines, title: 'Transcriptie', text: 'TaskBuddy zet het gesprek om in tekst, ook in het Nederlands.' },
  { icon: faWandMagicSparkles, title: 'Samenvatten', text: 'Laat een samenvatting of actiepunten maken, of kopieer de tekst.' }
];

function Landing() {
  return (
    <div className="page">
      <header className="topbar">
        <Brand />
        <button className="btn btn-ghost" onClick={handleSignIn}>Inloggen</button>
      </header>

      <main>
        <section className="hero">
          <h1>Neem gesprekken op.<br />Lees ze terug als tekst.</h1>
          <p className="lead">
            TaskBuddy maakt van elk gesprek een transcriptie, ook als er Nederlands
            gesproken wordt. Op je telefoon, in je browser of tijdens een Google Meet.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={handleSignIn}>Inloggen met Google</button>
            <span className="hint">Alleen op uitnodiging</span>
          </div>
        </section>

        <section className="section">
          <h2>Drie manieren om op te nemen</h2>
          <div className="cards">
            {WAYS.map((way) => (
              <article className="card" key={way.title}>
                <div className="card-icon"><FontAwesomeIcon icon={way.icon} /></div>
                <h3>{way.title}</h3>
                <p>{way.text}</p>
                {way.link && <a className="card-link" href={way.link.href}>{way.link.label} →</a>}
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Zo werkt het</h2>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li className="step" key={step.title}>
                <span className="step-number">{i + 1}</span>
                <div>
                  <h3><FontAwesomeIcon icon={step.icon} /> {step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="footer">
        <span>TaskBuddy</span>
        <a href="/extensie">Chrome-extensie</a>
      </footer>
    </div>
  );
}

export default Landing;
