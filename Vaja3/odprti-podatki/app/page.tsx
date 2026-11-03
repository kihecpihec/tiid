import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="#">
          <span className="brand-mark" aria-hidden="true">
            p<span>•</span>
          </span>
          povezani<span className="brand-dot">.</span>
        </a>
        <nav aria-label="Glavna navigacija">
          <a className="nav-active" href="#raziskuj">
            Raziskuj
          </a>
          <a href="#vir">
            O podatkih <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      <main id="raziskuj">
        <section className="hero">
          <div className="hero-copy">
            <h1>
              Na spletu smo.
              <br />
              <em>Kako povezani pa?</em>
            </h1>
            <p>
              Od prvih sporočil do družbenih omrežij. Raziščite, kako prebivalci
              Slovenije uporabljamo internet — in kako se naše navade
              spreminjajo.
            </p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="network-node node-one">@</div>
            <div className="network-node node-two">↗</div>
            <div className="network-node node-three">#</div>
            <div className="network-node node-four">···</div>
            <div className="network-center">
              mi<span>skupaj na spletu</span>
            </div>
          </div>
        </section>
        <Dashboard />
      </main>
      <footer>
        <a className="wordmark" href="#">
          povezani.
        </a>
        <p>Odprti podatki. Boljši pogled na naš digitalni vsakdan.</p>
        <span>TIID · Vaja 3 · PC-Axis / SURS</span>
      </footer>
    </>
  );
}
