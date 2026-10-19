// Shown to signed-in accounts that are not on the invite list
import Brand from '../components/Brand';
import '../styles/pages.css';

function NoAccess({ user, signOut }) {
  return (
    <div className="page">
      <header className="topbar">
        <Brand />
      </header>
      <main className="narrow">
        <section className="hero hero-compact">
          <h1>Nog geen toegang</h1>
          <p className="lead">
            TaskBuddy werkt op uitnodiging. Het account <strong>{user.email}</strong> staat
            nog niet op de lijst. Vraag degene die je over TaskBuddy vertelde om je toe te voegen.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={signOut}>Met een ander account inloggen</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default NoAccess;
