// Install page for the Google Meet extension: download, four steps, live install check
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCircleCheck, faPuzzlePiece, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useExtensionStatus, canInstallExtension } from '../hooks/useExtensionStatus';
import Brand from '../components/Brand';
import '../styles/pages.css';

const ZIP_URL = '/taskbuddy-meet-extension.zip';

function ExtensionInstall({ user }) {
  const status = useExtensionStatus();
  const supported = canInstallExtension();

  return (
    <div className="page">
      <header className="topbar">
        <Brand />
        <a className="btn btn-ghost" href="/"><FontAwesomeIcon icon={faArrowLeft} /> {user ? 'Terug' : 'Home'}</a>
      </header>

      <main className="narrow">
        <section className="hero hero-compact">
          <div className="card-icon card-icon-lg"><FontAwesomeIcon icon={faPuzzlePiece} /></div>
          <h1>Google Meet opnemen</h1>
          <p className="lead">
            De TaskBuddy-extensie voor Chrome neemt een Meet-gesprek op, met jouw stem én die van
            de anderen, en zet het in TaskBuddy om in tekst.
          </p>
        </section>

        {status === 'installed' ? (
          <div className="notice notice-ok">
            <FontAwesomeIcon icon={faCircleCheck} />
            <div>
              <strong>De extensie is geïnstalleerd.</strong>
              <p>Open een gesprek in Google Meet en klik op het TaskBuddy-icoon rechtsboven in Chrome.</p>
            </div>
          </div>
        ) : !supported ? (
          <div className="notice">
            <div>
              <strong>Dit werkt op je computer, in Chrome.</strong>
              <p>Open deze pagina op je laptop in Google Chrome (of Edge of Brave) om de extensie te installeren.</p>
            </div>
          </div>
        ) : null}

        <section className="section">
          <a className="btn btn-primary btn-lg btn-block" href={ZIP_URL} download>
            <FontAwesomeIcon icon={faDownload} /> Download de extensie
          </a>
          <p className="hint center">Binnenkort ook in de Chrome Web Store, dan is het één klik.</p>
        </section>

        <section className="section">
          <h2>Installeren in vier stappen</h2>
          <ol className="steps">
            <li className="step">
              <span className="step-number">1</span>
              <div>
                <h3>Pak het bestand uit</h3>
                <p>Dubbelklik op <code>taskbuddy-meet-extension.zip</code> in je Downloads. Je krijgt een map <code>taskbuddy-meet-extension</code>. Laat die map staan, Chrome gebruikt hem.</p>
              </div>
            </li>
            <li className="step">
              <span className="step-number">2</span>
              <div>
                <h3>Open de extensiepagina</h3>
                <p>Typ <code>chrome://extensions</code> in de adresbalk en druk op Enter.</p>
              </div>
            </li>
            <li className="step">
              <span className="step-number">3</span>
              <div>
                <h3>Zet de ontwikkelaarsmodus aan</h3>
                <p>Rechtsboven staat de schakelaar <em>Ontwikkelaarsmodus</em>. Zet hem aan.</p>
              </div>
            </li>
            <li className="step">
              <span className="step-number">4</span>
              <div>
                <h3>Laad de map</h3>
                <p>Klik op <em>Uitgepakte extensie laden</em> en kies de map <code>taskbuddy-meet-extension</code>. Zet de extensie daarna vast via het puzzelstukje in de werkbalk.</p>
              </div>
            </li>
          </ol>
          <p className="hint">
            Kom daarna terug op deze pagina en ververs hem: hierboven verschijnt dan een vinkje.
            {!user && ' Log ook één keer in op TaskBuddy, zodat de extensie je opnames kan uploaden.'}
          </p>
        </section>

        <section className="section">
          <h2>Opnemen in Meet</h2>
          <ol className="plain-list">
            <li>Open je gesprek in Google Meet.</li>
            <li>Klik op het TaskBuddy-icoon en kies <em>Start Recording</em>.</li>
            <li>Klik na afloop op <em>Stop</em>. De opname gaat naar TaskBuddy en de transcriptie verschijnt in je lijst.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

export default ExtensionInstall;
