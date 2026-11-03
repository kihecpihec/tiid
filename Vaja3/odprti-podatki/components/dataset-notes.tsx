import { plainText } from "@/lib/analysis";
import type { Dataset } from "@/lib/px/types";

export function DatasetNotes({
  data,
  purpose,
  sex,
  education,
}: {
  data: Dataset;
  purpose: string;
  sex: string;
  education: string;
}) {
  const selected: Record<string, string> = {
    "NAMEN UPORABE INTERNETA": purpose,
    SPOL: sex,
    IZOBRAZBA: education,
  };
  const categoryNotes = data.metadata.categoryNotes.filter((n) => {
    const d = data.dimensions.find((d) => d.name === n.dimension);
    const c = d?.categories.find((c) => c.code === selected[n.dimension]);
    return c && (n.category === c.code || n.category === c.label);
  });
  const updated = data.metadata.lastUpdated.replace(
    /^(\d{4})(\d{2})(\d{2})\s+/,
    "$3. $2. $1 ob ",
  );
  return (
    <section className="source-section" id="vir" aria-labelledby="source-title">
      <div className="section-kicker">PODATKI S KONTEKSTOM</div>
      <h2 id="source-title">Kaj nam številke povedo?</h2>
      <div className="source-grid">
        <div>
          <p>{data.metadata.description}</p>
          <dl>
            <div>
              <dt>Vir</dt>
              <dd>{data.metadata.source}</dd>
            </div>
            <div>
              <dt>Enota v datoteki</dt>
              <dd>{data.metadata.units}</dd>
            </div>
            <div>
              <dt>Zadnja posodobitev zbirke</dt>
              <dd>{updated}</dd>
            </div>
            <div>
              <dt>Obseg</dt>
              <dd>Slovenija · posamezniki, stari 16–74 let</dd>
            </div>
          </dl>
        </div>
        <div className="method-note">
          <strong>Berimo jih pravilno.</strong>
          <p>
            Delež = izbrana vrednost / prebivalstvo (STAT2) za isto leto, spol
            in izobrazbo × 100. Osnova ni število uporabnikov interneta.
            Manjkajoča ali ničelna osnova ne da deleža.
          </p>
          <p>
            Dejavnosti se lahko prekrivajo. Skupin in njihovih skupnih vrednosti
            ne seštevamo. Oznaka »..« je manjkajoč podatek, številka 0 pa
            veljavna ničla.
          </p>
          <p>
            Osvežitev znova prebere priloženo datoteko PX. Novejših podatkov
            SURS ne prenese samodejno.
          </p>
        </div>
      </div>
      {categoryNotes.map((n) => (
        <p className="notice" key={`${n.dimension}:${n.category}`}>
          {plainText(n.text)}
        </p>
      ))}
      <details>
        <summary>Izvorne opombe in oznake</summary>
        <div className="original-notes">
          {data.metadata.notes.map((n, i) => (
            <p key={i}>{plainText(n)}</p>
          ))}
          <p>
            Datoteka določa simbole:{" "}
            {Object.entries(data.metadata.symbols)
              .map(([k, v]) => `${k} = »${v}«`)
              .join("; ")}
            . Njihov pomen tukaj ni dodatno razložen.
          </p>
          <p>
            Opombe posameznih celic so prikazane ob vrednostih. Oznake (npr. M)
            so prepisane iz vira; njihovega pomena ne predpostavljamo. Pri
            deležih ohranimo tudi opombe osnove STAT2.
          </p>
        </div>
      </details>
    </section>
  );
}
