import "./SectionPlaceholderPage.css";

function SectionPlaceholderPage({ eyebrow, title, description }) {
  return (
    <section className="section-placeholder">
      <div className="section-placeholder__card">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}

export default SectionPlaceholderPage;
