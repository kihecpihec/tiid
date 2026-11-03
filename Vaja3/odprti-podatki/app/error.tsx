"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="state-panel" role="alert">
      <h1>Pri prikazu je prišlo do napake.</h1>
      <p>Poskusite znova naložiti podatke.</p>
      <button className="outline-button" onClick={reset}>
        Poskusi znova
      </button>
    </main>
  );
}
