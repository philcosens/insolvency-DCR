"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import submissionData from "../data/dcrs-submissions.json";

type Question = (typeof submissionData)[number]["questions"][number];
type Section = (typeof submissionData)[number];
type Answers = Record<string, string | string[]>;
type PrototypeState = {
  answers: Answers;
  submittedId: string | null;
  furtherActive: boolean;
  evidence: string[];
};

const storageKey = "dcrs-node-prototype-v1";
const emptyState: PrototypeState = { answers: {}, submittedId: null, furtherActive: false, evidence: [] };
const sections = submissionData as Section[];
const essentialSections = sections.filter((section) => section.submission === "essential");
const furtherSections = sections.filter((section) => section.submission === "further");

function sectionPath(section: Section, question = 1) {
  return `/section/${section.number}/question/${question}`;
}

function displayNumber(section: Section) {
  return section.submission === "further" ? section.number - essentialSections.length : section.number;
}

function getProgress(section: Section, answers: Answers) {
  const required = section.questions.filter((question) => question.required);
  const total = required.length || section.questions.length;
  const completed = required.length
    ? required.filter((question) => hasAnswer(answers[question.id])).length
    : section.questions.filter((question) => hasAnswer(answers[question.id])).length;
  return { completed, total, status: completed === total ? "Completed" : completed > 0 ? "In progress" : "Not started" };
}

function hasAnswer(answer: string | string[] | undefined) {
  return Array.isArray(answer) ? answer.length > 0 : Boolean(answer?.trim());
}

function DcrsHeader() {
  return <header className="dcrs-header"><div className="dcrs-width-container dcrs-header__inner">
    <img className="dcrs-header__crest" src="/assets/images/govuk-crest.svg" alt="" />
    <a className="dcrs-header__service" href="/">Director Conduct Reporting Service</a>
  </div></header>;
}

function DcrsFooter() {
  return <footer className="dcrs-footer"><div className="dcrs-width-container"><p className="govuk-body-s">DCRS prototype · GOV.UK styles</p></div></footer>;
}

function Tag({ children, colour = "grey" }: { children: string; colour?: string }) {
  const tagClass = colour === "green" ? "govuk-tag--green" : colour === "blue" ? "govuk-tag--blue" : "govuk-tag--grey";
  return <strong className={`govuk-tag ${tagClass}`}>{children}</strong>;
}

function Progress({ title, completed, total }: { title: string; completed: number; total: number }) {
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return <div className="dcrs-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed} aria-valuetext={`${completed} of ${total} sections complete`} aria-label={`${title} progress`}>
    <div className="govuk-body dcrs-progress__labels"><span>{completed} of {total} sections complete</span><span>{percent}%</span></div>
    <div className="dcrs-progress__track" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
  </div>;
}

export default function DcrsApp({ initialPath }: { initialPath: string }) {
  const [store, setStore] = useState<PrototypeState>(emptyState);
  const [ready, setReady] = useState(false);
  const [testToolsOpen, setTestToolsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const path = `/${initialPath.split("/").filter(Boolean).join("/")}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setStore({ ...emptyState, ...JSON.parse(saved) as Partial<PrototypeState> });
    } catch { /* Start with a clean prototype if browser storage is unavailable. */ }
    setReady(true);
  }, []);

  const persist = (next: PrototypeState) => {
    setStore(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Prototype remains usable for this session. */ }
  };
  const updateAnswer = (id: string, value: string | string[]) => persist({ ...store, answers: { ...store.answers, [id]: value } });

  const essentialProgress = useMemo(() => essentialSections.map((section) => getProgress(section, store.answers)), [store.answers]);
  const furtherProgress = useMemo(() => furtherSections.map((section) => getProgress(section, store.answers)), [store.answers]);
  const essentialCompleted = essentialProgress.filter((item) => item.status === "Completed").length + (store.evidence.length ? 1 : 0);
  const essentialTotal = essentialSections.length + 1;
  const furtherCompleted = furtherProgress.filter((item) => item.status === "Completed").length;

  const currentMatch = path.match(/^\/section\/(\d+)\/question\/(\d+)/);
  const currentSection = currentMatch ? sections.find((section) => section.number === Number(currentMatch[1])) : undefined;
  const currentQuestionNumber = currentMatch ? Number(currentMatch[2]) : 1;
  const currentQuestion = currentSection?.questions[currentQuestionNumber - 1];
  const onQuestionPage = Boolean(currentSection && currentQuestion);

  if (!ready) return <><DcrsHeader /><main className="dcrs-width-container dcrs-main"><p className="govuk-body">Loading your report…</p></main><DcrsFooter /></>;

  const pageTitle = path === "/essential-information" ? "Essential information"
    : path === "/further-information" ? "Further information"
    : path === "/supporting-evidence" ? "Supporting evidence"
    : path === "/essential-information-submitted" ? "Essential information submitted"
    : path === "/submitted-information" ? "Submitted information"
    : onQuestionPage ? currentSection!.title : "Your reports";

  const handleSubmitQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuestion = currentSection!.questions.findIndex((question) => question.id === currentQuestion!.id) + 2;
    if (nextQuestion <= currentSection!.questions.length) window.location.href = sectionPath(currentSection!, nextQuestion);
    else window.location.href = currentSection!.submission === "essential" ? "/essential-information" : "/further-information";
  };

  const handleEssentialSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (essentialCompleted < essentialTotal) return;
    const submissionId = `DCRS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    persist({ ...store, submittedId: submissionId });
    window.location.href = "/essential-information-submitted";
  };

  const resetAll = () => {
    persist(emptyState);
    setNotice("All saved answers and supporting evidence have been cleared.");
  };

  return <>
    <DcrsHeader />
    <main className="dcrs-width-container dcrs-main">
      <span className="govuk-caption-xl">Director Conduct Reporting Service</span>
      <h1 className="govuk-heading-xl">{pageTitle}</h1>
      {notice && <div className="govuk-notification-banner govuk-notification-banner--success" role="status"><div className="govuk-notification-banner__content"><p className="govuk-notification-banner__heading">{notice}</p></div></div>}
      {path === "/" && <>
        <p className="dcrs-case-meta govuk-body">Example report · Northstar Interiors Ltd · Company number: 15384921</p>
        <div className="dcrs-stage-grid">
          <section className={`dcrs-stage-card ${store.submittedId ? "dcrs-stage-card--submitted" : ""}`} aria-labelledby="essential-title">
            <div className="dcrs-stage-card__heading"><h2 className="govuk-heading-m" id="essential-title">Essential information</h2><Tag colour={store.submittedId ? "green" : essentialCompleted === essentialTotal ? "green" : "blue"}>{store.submittedId ? "Submitted" : essentialCompleted === essentialTotal ? "Ready to submit" : "In progress"}</Tag></div>
            {store.submittedId ? <><p className="govuk-body"><strong>Essential information has been submitted for initial assessment.</strong></p><p className="govuk-body">You do not need to complete it again unless you need to make a change.</p><a className="govuk-button govuk-button--secondary" href="/submitted-information">View submitted information</a><p className="govuk-body"><a className="govuk-link" href="/essential-information">Edit essential information</a></p></>
              : <><p className="govuk-body">Provide the information needed for the initial assessment.</p><Progress title="Essential information" completed={essentialCompleted} total={essentialTotal} /><ul className="govuk-list dcrs-stage-list">{essentialSections.map((section) => <StageListItem key={section.number} section={section} answers={store.answers} />)}<li><a className="govuk-link" href="/supporting-evidence">Supporting evidence</a><span className="dcrs-stage-list__status">{store.evidence.length ? "Completed" : "Not started"}</span></li></ul><a className="govuk-button govuk-!-margin-top-4" href="/essential-information">Continue essential information</a></>}
          </section>
          <section className={`dcrs-stage-card ${store.furtherActive ? "" : "dcrs-stage-card--locked"}`} aria-labelledby="further-title">
            <div className="dcrs-stage-card__heading"><h2 className="govuk-heading-m" id="further-title">Further information</h2><Tag colour={store.furtherActive ? "blue" : "grey"}>{store.furtherActive ? "Available" : "Not available yet"}</Tag></div>
            {store.furtherActive ? <><p className="govuk-body">Provide additional information requested after the initial assessment.</p><Progress title="Further information" completed={furtherCompleted} total={furtherSections.length} /><ul className="govuk-list dcrs-stage-list">{furtherSections.map((section) => <StageListItem key={section.number} section={section} answers={store.answers} />)}<li><a className="govuk-link" href="/supporting-evidence">Supporting evidence</a><span className="dcrs-stage-list__status">{store.evidence.length ? "Completed" : "Not started"}</span></li></ul><a className="govuk-button govuk-!-margin-top-4" href="/further-information">Continue further information</a></>
              : <><p className="govuk-body">This section becomes available after the initial assessment.</p><div className="govuk-inset-text">Further information is not currently required for this prototype report.</div></>}
          </section>
        </div>
        <div className="dcrs-testing"><details><summary className="govuk-details__summary"><span className="govuk-details__summary-text">Prototype testing tools</span></summary><div className="govuk-details__text"><p className="govuk-body">These controls are for testing the prototype. A live service would receive the assessment outcome from its case management system.</p><button type="button" className="govuk-button govuk-button--secondary" onClick={() => { persist({ ...store, furtherActive: true }); setNotice("Further information is now available for testing."); }}>Activate Further information</button><button type="button" className="govuk-button govuk-button--warning" onClick={resetAll}>Clear all answers and evidence</button><button type="button" className="govuk-button govuk-button--secondary" onClick={() => { persist({ ...store, submittedId: null }); setNotice("Test submission status reset."); }}>Reset test submission</button></div></details></div>
      </>}

      {path === "/further-information" && !store.furtherActive && <div className="govuk-inset-text">Further information is not available yet. Return to <a className="govuk-link" href="/">your reports</a> for the latest status.</div>}
      {(path === "/essential-information" || (path === "/further-information" && store.furtherActive)) && <StagePage
        sections={path === "/essential-information" ? essentialSections : furtherSections}
        answers={store.answers}
        evidenceCount={store.evidence.length}
        completed={path === "/essential-information" ? essentialCompleted : furtherCompleted}
        total={path === "/essential-information" ? essentialTotal : furtherSections.length}
        onSubmit={handleEssentialSubmit}
        submittedId={path === "/essential-information" ? store.submittedId : null}
      />}

      {onQuestionPage && currentSection?.submission === "further" && !store.furtherActive && <div className="govuk-inset-text">This section is not available yet. Return to <a className="govuk-link" href="/">your reports</a> for the latest status.</div>}
      {onQuestionPage && currentQuestion && currentSection && (currentSection.submission === "essential" || store.furtherActive) && <>
        <nav className="govuk-breadcrumbs" aria-label="Breadcrumb"><ol className="govuk-breadcrumbs__list"><li className="govuk-breadcrumbs__list-item"><a className="govuk-breadcrumbs__link" href="/">Your reports</a></li><li className="govuk-breadcrumbs__list-item"><a className="govuk-breadcrumbs__link" href={currentSection.submission === "essential" ? "/essential-information" : "/further-information"}>{currentSection.submission === "essential" ? "Essential information" : "Further information"}</a></li><li className="govuk-breadcrumbs__list-item" aria-current="page">Question {currentQuestionNumber}</li></ol></nav>
        <div className="dcrs-question-layout">
          <aside className="dcrs-question-nav" aria-labelledby="question-nav-heading"><h2 className="govuk-heading-s" id="question-nav-heading">{currentSection.submission === "essential" ? "Essential information" : "Further information"}</h2><ul className="dcrs-question-nav__list">{(currentSection.submission === "essential" ? essentialSections : furtherSections).map((section) => <li key={section.number} className={`dcrs-question-nav__item ${section.number === currentSection.number ? "dcrs-question-nav__item--current" : ""}`}><a className="dcrs-question-nav__link" href={sectionPath(section)}>{displayNumber(section)}. {section.title}</a><span className="dcrs-question-nav__status">{getProgress(section, store.answers).status}</span>{section.number === currentSection.number && <ul className="dcrs-question-nav__children">{section.questions.map((question, index) => <li key={question.id} className={`dcrs-question-nav__item ${index + 1 === currentQuestionNumber ? "dcrs-question-nav__item--current" : ""}`}><a className="dcrs-question-nav__link" href={sectionPath(section, index + 1)} aria-current={index + 1 === currentQuestionNumber ? "page" : undefined}>{displayNumber(section)}.{index + 1} {question.text}</a></li>)}</ul>}</li>)}</ul></aside>
          <section className="dcrs-question-content"><a className="govuk-back-link" href={currentSection.submission === "essential" ? "/essential-information" : "/further-information"}>Back to sections</a><span className="govuk-caption-xl">Section {displayNumber(currentSection)}</span><h2 className="govuk-heading-xl">{currentSection.title}</h2><p className="govuk-body-l">Question {currentQuestionNumber} of {currentSection.questions.length}</p>
            <form onSubmit={handleSubmitQuestion}><QuestionControl question={currentQuestion} value={store.answers[currentQuestion.id]} onChange={(value) => updateAnswer(currentQuestion.id, value)} />
              <div className="govuk-button-group"><button className="govuk-button" type="submit">Save and continue</button>{currentQuestionNumber > 1 && <a className="govuk-link" href={sectionPath(currentSection, currentQuestionNumber - 1)}>Previous question</a>}</div>
            </form>
          </section>
        </div>
      </>}

      {path === "/supporting-evidence" && <section aria-labelledby="evidence-heading"><p className="govuk-body">Upload documents that support this report. This prototype stores file names in this browser only.</p><h2 className="govuk-heading-m" id="evidence-heading">Supporting evidence</h2><label className="govuk-label" htmlFor="evidence-files">Choose files</label><div className="govuk-hint" id="evidence-hint">PDF, DOCX, XLSX or CSV files, up to 10MB each.</div><input className="govuk-file-upload" id="evidence-files" type="file" multiple accept=".pdf,.docx,.xlsx,.csv" aria-describedby="evidence-hint" onChange={(event) => { const names = Array.from(event.target.files ?? []).map((file) => file.name); if (names.length) persist({ ...store, evidence: [...store.evidence, ...names] }); event.currentTarget.value = ""; }} />{store.evidence.length > 0 && <><h3 className="govuk-heading-s govuk-!-margin-top-6">Uploaded evidence</h3><ul className="govuk-list dcrs-evidence-list">{store.evidence.map((name, index) => <li key={`${name}-${index}`}>{name} <button type="button" className="govuk-link" onClick={() => persist({ ...store, evidence: store.evidence.filter((_, fileIndex) => fileIndex !== index) })} aria-label={`Remove ${name}`}>Remove</button></li>)}</ul></>}<p className="govuk-body govuk-!-margin-top-6"><a className="govuk-button" href="/">Return to your reports</a></p></section>}

      {path === "/essential-information-submitted" && <SubmittedPage submissionId={store.submittedId} />}
      {path === "/submitted-information" && <SubmittedAnswers answers={store.answers} />}
    </main>
    <DcrsFooter />
  </>;
}

function StageListItem({ section, answers }: { section: Section; answers: Answers }) {
  const progress = getProgress(section, answers);
  return <li><a className="govuk-link" href={sectionPath(section)}>{displayNumber(section)}. {section.title}</a><span className="dcrs-stage-list__status">{progress.status}</span></li>;
}

function StagePage({ sections: stageSections, answers, evidenceCount, completed, total, onSubmit, submittedId }: {
  sections: Section[]; answers: Answers; evidenceCount: number; completed: number; total: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void; submittedId: string | null;
}) {
  const isFurther = stageSections[0]?.submission === "further";
  return <>
    <a className="govuk-back-link" href="/">Back to your reports</a>
    <p className="govuk-body-l">{isFurther ? "Complete the sections requested after the initial assessment." : "Complete all sections before submitting for initial assessment."}</p>
    <Progress title={isFurther ? "Further information" : "Essential information"} completed={completed} total={total} />
    <ul className="govuk-list dcrs-stage-list">{stageSections.map((section) => <StageListItem key={section.number} section={section} answers={answers} />)}{!isFurther && <li><a className="govuk-link" href="/supporting-evidence">Supporting evidence</a><span className="dcrs-stage-list__status">{evidenceCount ? "Completed" : "Not started"}</span></li>}{isFurther && <li><a className="govuk-link" href="/supporting-evidence">Supporting evidence</a><span className="dcrs-stage-list__status">{evidenceCount ? "Completed" : "Not started"}</span></li>}</ul>
    {!isFurther && (submittedId ? <div className="govuk-inset-text">Essential information has been submitted. <a className="govuk-link" href="/essential-information-submitted">View confirmation</a>.</div> : <form onSubmit={onSubmit} className="govuk-!-margin-top-6"><button className="govuk-button" type="submit" disabled={completed < total}>Submit essential information</button>{completed < total && <p className="govuk-hint">Complete all required answers and upload supporting evidence before submitting.</p>}</form>)}
  </>;
}

function QuestionControl({ question, value, onChange }: { question: Question; value: string | string[] | undefined; onChange: (value: string | string[]) => void }) {
  const id = question.id;
  const options = question.options ?? [];
  const valueString = Array.isArray(value) ? "" : value ?? "";
  const set = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.currentTarget.value);
  if (question.type === "action") return <div className="govuk-inset-text"><p className="govuk-body">{question.text}</p>{question.hint && <p className="govuk-body">{question.hint}</p>}</div>;
  const descriptions = [question.required ? `${id}-required` : null, question.hint || question.validation ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return <div className="govuk-form-group"><fieldset className="govuk-fieldset" aria-describedby={descriptions}><legend className="govuk-fieldset__legend govuk-fieldset__legend--m"><h2 className="govuk-fieldset__heading">{question.text}</h2></legend>{question.required && <p className="govuk-hint" id={`${id}-required`}>Required</p>}{(question.hint || question.validation) && <div className="govuk-hint" id={`${id}-hint`}>{question.hint || question.validation}</div>}
    {question.type === "radio" ? <div className="govuk-radios">{options.map((option, index) => <div className="govuk-radios__item" key={option}><input className="govuk-radios__input" id={`${id}-${index}`} name={id} type="radio" required={question.required} value={option} checked={valueString === option} onChange={(event) => onChange(event.currentTarget.value)} /><label className="govuk-label govuk-radios__label" htmlFor={`${id}-${index}`}>{option}</label></div>)}</div>
      : question.type === "checkboxes" ? <div className="govuk-checkboxes">{options.map((option, index) => { const values = Array.isArray(value) ? value : []; return <div className="govuk-checkboxes__item" key={option}><input className="govuk-checkboxes__input" id={`${id}-${index}`} name={id} type="checkbox" required={question.required && index === 0} value={option} checked={values.includes(option)} onChange={(event) => onChange(event.currentTarget.checked ? [...values, option] : values.filter((item) => item !== option))} /><label className="govuk-label govuk-checkboxes__label" htmlFor={`${id}-${index}`}>{option}</label></div>; })}</div>
      : question.type === "date" ? <div className="govuk-date-input"><div className="govuk-date-input__item"><label className="govuk-label govuk-date-input__label" htmlFor={id}>Date</label><input className="govuk-input govuk-date-input__input govuk-input--width-10" id={id} name={id} type="text" inputMode="numeric" required={question.required} placeholder="dd/mm/yyyy" value={valueString} onChange={set} /></div></div>
      : question.type === "text" && (id.includes("company-information") || question.text.toLowerCase().includes("name") || question.text.toLowerCase().includes("number")) ? <input className="govuk-input govuk-!-width-two-thirds" id={id} name={id} type="text" required={question.required} value={valueString} onChange={set} />
      : question.type === "text" ? <textarea className="govuk-textarea" id={id} name={id} rows={6} required={question.required} value={valueString} onChange={set} />
      : <input className="govuk-input govuk-!-width-two-thirds" id={id} name={id} type={question.type === "url" ? "url" : "text"} required={question.required} value={valueString} onChange={set} />}
  </fieldset></div>;
}

function SubmittedPage({ submissionId }: { submissionId: string | null }) {
  if (!submissionId) return <div className="govuk-inset-text">No test submission is available. <a className="govuk-link" href="/essential-information">Return to Essential information</a>.</div>;
  return <>
    <div className="govuk-notification-banner govuk-notification-banner--success dcrs-submission-banner" role="status" aria-labelledby="submission-title"><div className="govuk-notification-banner__header"><h2 className="govuk-notification-banner__title" id="submission-title">Essential information submitted</h2></div><div className="govuk-notification-banner__content"><p className="govuk-notification-banner__heading">Submission ID: {submissionId}</p></div></div>
    <p className="govuk-body">Thank you. We have received the essential information for this report. We will now assess the information you have provided. You do not need to do anything at the moment.</p>
    <h2 className="govuk-heading-m">What happens next?</h2>
    <ol className="dcrs-timeline"><li><span className="dcrs-timeline__number" aria-hidden="true">1</span><div><strong>Initial assessment</strong><p className="govuk-body">We will assess the information you submitted.</p></div></li><li><span className="dcrs-timeline__number" aria-hidden="true">2</span><div><strong>We will let you know the outcome.</strong></div></li><li><span className="dcrs-timeline__number" aria-hidden="true">3</span><div><strong>If further information is required, we will invite you to complete the next stage.</strong></div></li></ol>
    <div className="dcrs-actions"><a className="govuk-link" href="/submitted-information">View submitted information</a><br /><a className="govuk-button" href="/">Return to your reports</a></div>
  </>;
}

function SubmittedAnswers({ answers }: { answers: Answers }) {
  const answered = sections.flatMap((section) => section.questions.filter((question) => hasAnswer(answers[question.id])).map((question) => ({ section: section.title, question: question.text, answer: answers[question.id] })));
  return <><a className="govuk-back-link" href="/">Back to your reports</a><p className="govuk-body">Information saved in this browser for the prototype report.</p>{answered.length ? <dl className="govuk-summary-list">{answered.map((item) => <div className="govuk-summary-list__row" key={`${item.section}-${item.question}`}><dt className="govuk-summary-list__key">{item.question}<span className="govuk-hint">{item.section}</span></dt><dd className="govuk-summary-list__value">{Array.isArray(item.answer) ? item.answer.join(", ") : item.answer}</dd></div>)}</dl> : <p className="govuk-body">No answers have been saved yet.</p>}</>;
}
