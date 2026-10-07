import assert from 'node:assert/strict';
import fs from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import test from 'node:test';

// Inspect ZIP central entries using built-ins; no DOCX runtime is required by
// the portable suite. Rendering remains an authoring-environment check.
function parts(buffer) {
  const result = new Map();
  const end = buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
  assert.ok(end >= 0);
  let cursor = buffer.readUInt32LE(end + 16);
  const count = buffer.readUInt16LE(end + 10);
  for (let i = 0; i < count; i++) {
    assert.equal(buffer.readUInt32LE(cursor),0x02014b50);
    const method=buffer.readUInt16LE(cursor+10), size=buffer.readUInt32LE(cursor+20);
    const length=buffer.readUInt16LE(cursor+28), extra=buffer.readUInt16LE(cursor+30), comment=buffer.readUInt16LE(cursor+32);
    const name=buffer.subarray(cursor+46,cursor+46+length).toString();
    const offset=buffer.readUInt32LE(cursor+42);
    const start=offset+30+buffer.readUInt16LE(offset+26)+buffer.readUInt16LE(offset+28);
    const compressed=buffer.subarray(start,start+size);
    assert.ok([0,8].includes(method));
    result.set(name,(method===8?inflateRawSync(compressed):compressed).toString());
    cursor+=46+length+extra+comment;
  }
  return result;
}
test('consultation template preserves identity mapping, sections and editable notice styles',()=>{
  const zip=parts(fs.readFileSync(new URL('../../assets/templates/expert-consultation.docx',import.meta.url)));
  const document=zip.get('word/document.xml'), mapping=zip.get('customXml/item1.xml');
  const ids=[...mapping.matchAll(/<ticket\s+id="([^"]+)"/g)].map(m=>m[1]);
  const bookmarks=[...document.matchAll(/w:name="(ticket_[^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(bookmarks.sort(),ids.map(id=>'ticket_'+id.replaceAll('-','_')).sort());
  assert.equal(new Set(bookmarks).size,bookmarks.length);
  assert.match(mapping,/<consultation prepared="[^"]+" package="[^"]+"/);
  assert.doesNotMatch(mapping,/answerability|status=|owner=|processing/);
  assert.match(zip.get('word/_rels/document.xml.rels'),/Target="\.\.\/customXml\/item1.xml"/);
  assert.match(zip.get('[Content_Types].xml'),/Extension="xml" ContentType="application\/xml"/);
  const sections = [...document.matchAll(/<w:sectPr[ >][\s\S]*?<\/w:sectPr>/g)].map(m => m[0]);
  assert.ok(sections.length > 1);
  for (const section of sections) {
    // Omitted w:type means nextPage in WordprocessingML.
    const type = section.match(/<w:type w:val="([^"]+)"/);
    assert.ok(!type || type[1] === 'nextPage');
  }
  assert.ok([...zip.keys()].filter(k=>/^word\/header\d+\.xml$/.test(k)).length>=3);
  assert.doesNotMatch(zip.get('word/settings.xml'),/<w:documentProtection/);
  for(const style of ['ConsultationOverview','AnswerAfter','WaitingFor','DependencyReview']) {
    assert.match(document,new RegExp('w:pStyle w:val="'+style+'"'));
    assert.match(zip.get('word/styles.xml'),new RegExp('w:styleId="'+style+'"'));
  }
});

test('consultation navigation resolves to distinct topic and question anchors', () => {
  const zip = parts(fs.readFileSync(new URL('../../assets/templates/expert-consultation.docx', import.meta.url)));
  const document = zip.get('word/document.xml');
  const names = [...document.matchAll(/<w:bookmarkStart\b[^>]*w:name="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(names).size, names.length, 'all navigation and canonical bookmarks are unique');
  const links = [...document.matchAll(/<w:hyperlink\b[^>]*w:anchor="([^"]+)"/g)].map(m => m[1]);
  assert.ok(links.length > 0);
  for (const anchor of links) assert.ok(names.includes(anchor), `unresolved link ${anchor}`);
  const paragraphs = [...document.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(m => m[0]);
  const topics = paragraphs.filter(p => /w:pStyle w:val="Heading1"/.test(p));
  assert.ok(topics.length > 0);
  for (const topic of topics) {
    const anchor = topic.match(/w:name="(nav_[^"]+)"/)[1];
    assert.ok(links.includes(anchor), `topic missing from contents: ${anchor}`);
  }
  for (const p of paragraphs.filter(p => /w:name="ticket_/.test(p))) {
    assert.match(p, /w:pStyle w:val="Heading2"/);
    const id = p.match(/w:name="ticket_(TICKET_\d+)"/)[1].replaceAll('_', '-');
    assert.ok(paragraphText(p).startsWith(`${id} — `), 'heading starts with its exact canonical ID');
    assert.doesNotMatch(p, /<w:br\b/, 'ID is not on a separate line');
  }
  assert.match(document, /w:pStyle w:val="Heading3"/);
});

test('availability notices are paragraph styles with visible grayscale treatment and local scope', () => {
  const zip = parts(fs.readFileSync(new URL('../../assets/templates/expert-consultation.docx', import.meta.url)));
  const document = zip.get('word/document.xml');
  const styles = zip.get('word/styles.xml');
  for (const id of ['ReadyToAnswer', 'AnswerAfter', 'WaitingFor', 'DependencyReview']) {
    const definitions = [...styles.matchAll(/<w:style\b[^>]*>[\s\S]*?<\/w:style>/g)].map(m => m[0]).filter(s => s.includes(`w:styleId="${id}"`));
    assert.equal(definitions.length, 1, `one definition of ${id}`);
    assert.match(definitions[0], /<w:shd\b/);
    assert.match(definitions[0], /<w:pBdr>/);
    assert.match(document, new RegExp(`w:pStyle w:val="${id}"`));
  }
  const ticketTwo = document.slice(document.indexOf('w:name="ticket_TICKET_0002"'));
  assert.match(ticketTwo, /w:pStyle w:val="ReadyToAnswer"[\s\S]*w:pStyle w:val="WaitingFor"[\s\S]*w:pStyle w:val="DependencyReview"/);
  assert.match([...zip.entries()].filter(([name]) => /^word\/footer\d+\.xml$/.test(name)).map(([, xml]) => xml).join(''), /PAGE/);
  const paragraphs = [...document.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(m => m[0]);
  for (const p of paragraphs.filter(p => /w:pStyle w:val="(?:ReadyToAnswer|AnswerAfter|WaitingFor|DependencyReview)"/.test(p))) {
    assert.match(p, /<w:keepNext(?:\s[^>]*)?\/>/);
    assert.doesNotMatch(p, /<w:keepNext w:val="0"/);
  }
});

function paragraphText(xml) {
  return [...xml.matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>/g)].map(m => m[1])
    .join('').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
}

test('topic and question counts match included identities and local numbered questions', () => {
  const zip = parts(fs.readFileSync(new URL('../../assets/templates/expert-consultation.docx', import.meta.url)));
  const ps = [...zip.get('word/document.xml').matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(m => m[0]);
  const style = p => p.match(/w:pStyle w:val="([^"]+)"/)?.[1];
  const ticket = p => p.match(/w:name="(ticket_[^"]+)"/)?.[1];
  const label = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  for (let i = 0; i < ps.length; i++) {
    if (style(ps[i]) === 'Heading1') {
      let end = ps.findIndex((p, j) => j > i && style(p) === 'Heading1');
      if (end < 0) end = ps.length;
      const ids = new Set(ps.slice(i + 1, end).map(ticket).filter(Boolean));
      assert.ok(ids.size > 0);
      assert.equal(style(ps[i + 1]), 'ConsultationCount');
      assert.equal(paragraphText(ps[i + 1]), label(ids.size, 'ticket'));
    }
    if (ticket(ps[i])) {
      let end = ps.findIndex((p, j) => j > i && (style(p) === 'Heading1' || ticket(p)));
      if (end < 0) end = ps.length;
      const questions = ps.slice(i + 1, end).filter(p => style(p) === 'Heading3');
      assert.ok(questions.length > 0);
      assert.equal(style(ps[i + 1]), 'ConsultationCount');
      assert.equal(paragraphText(ps[i + 1]), label(questions.length, 'question'));
      questions.forEach((p, index) => assert.ok(paragraphText(p).startsWith(`${index + 1}. `)));
    }
  }
});

test('local dependency examples distinguish location, unresolved tickets, facts and resolved references', () => {
  const zip = parts(fs.readFileSync(new URL('../../assets/templates/expert-consultation.docx', import.meta.url)));
  const xml = zip.get('word/document.xml');
  const ps = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(m => m[0]);
  const notice = id => ps.find(p => p.includes(`w:pStyle w:val="${id}"`));
  const internal = notice('AnswerAfter');
  assert.equal(paragraphText(textRuns(internal)[0]), 'Prerequisite');
  const anchor = internal.match(/w:anchor="([^"]+)"/)[1];
  const target = ps.find(p => p.includes(`w:name="${anchor}"`));
  assert.ok(target, 'internal prerequisite resolves');
  assert.match(paragraphText(internal), /TICKET-\d+/);
  assert.match(paragraphText(internal), /page \d+/); // actual page checked in render QA
  assert.ok(/Heading[23]/.test(target), 'link targets ticket or question');
  const outside = paragraphText(notice('WaitingFor'));
  assert.equal(paragraphText(textRuns(notice('WaitingFor'))[0]), 'Pending confirmation');
  assert.match(outside, /not included in this consultation/i);
  assert.match(outside, /availability is not yet confirmed/);
  assert.match(outside, /TICKET-\d+[\s\S]+deferred pending/i);
  assert.match(outside, /final.+choice.+wait/i);
  const revision = paragraphText(notice('DependencyReview'));
  assert.ok(revision.startsWith('Question needs revision'));
  assert.doesNotMatch(revision, /Outside this document|Reference outside|Waiting for/);
  assert.match(revision, /current question.+omits the approved/);
  assert.match(revision, /alternatives need revision before a final/);

  // Approved context belongs to an answerable question, not a waiting notice.
  const approved = ps.findIndex(p => paragraphText(p).includes('TICKET-0070'));
  assert.ok(approved > 0);
  assert.match(ps[approved - 1], /w:pStyle w:val="ReadyToAnswer"/);
  assert.match(paragraphText(ps[approved]), /Already decided:.+What remains to decide:/);
  assert.doesNotMatch(ps[approved], /w:pStyle w:val="(?:WaitingFor|DependencyReview)"/);

  // The incomplete question solicits examples, never obsolete final choices.
  const reviewIndex = ps.indexOf(notice('DependencyReview'));
  const tail = ps.slice(reviewIndex).map(paragraphText);
  assert.ok(tail.some(t => /TICKET-0090, approved/.test(t)));
  assert.ok(tail.some(t => t.startsWith('Provisional advice requested:')));
  assert.ok(tail.some(t => t.startsWith('Your provisional advice:')));
  assert.ok(!tail.some(t => /^[AB]\. /.test(t)), 'obsolete fixed schedules are not offered as choices');
  assert.ok(!tail.some(t => /do not answer.+again/i.test(t)));
  assert.doesNotMatch(xml, /<w:hyperlink[^>]*r:id=/, 'no external hyperlink integration');
});


test('consultation guidance requires cause interpretation and authorized question preparation', () => {
  const guidance = fs.readFileSync(new URL('../../references/expert-consultation.md', import.meta.url), 'utf8');
  assert.doesNotMatch(guidance, /Map the analysis labels[^\n]+respectively/i);
  assert.match(guidance, /not an unconditional one-to-one mapping/);
  assert.match(guidance, /Document generation alone does not authorize ticket edits/);
  assert.match(guidance, /minimum repair needed/);
  assert.match(guidance, /scope, configuration granularity, assumptions, and recommendation/);
  assert.match(guidance, /standalone working document by default/);
  assert.match(guidance, /resolved prerequisite normally supplies approved context/);
});

// Small OOXML readers keep these contracts portable. Attribute order and empty
// element serialization are irrelevant; formatting follows the used style chain.
const elements = (xml, tag) => [...xml.matchAll(new RegExp(`<w:${tag}\\b[^>]*(?:\\/>|>[\\s\\S]*?<\\/w:${tag}>)`, 'g'))].map(m => m[0]);
const attributes = xml => Object.fromEntries([...xml.split('>')[0].matchAll(/w:([\w]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const property = (xml, tag) => attributes(elements(xml, tag)[0] || '');
const runProperties = xml => elements(xml, 'rPr')[0] || '';
const textRuns = p => elements(p, 'r').filter(r => paragraphText(r).trim());
function formattingModel(zip) {
  const styles = new Map(elements(zip.get('word/styles.xml'), 'style').map(s => [attributes(s).styleId, s]));
  const defaults = runProperties(elements(zip.get('word/styles.xml'), 'rPrDefault')[0]);
  const chain = (id, seen = new Set()) => {
    if (!id) return [];
    assert.ok(!seen.has(id), `cyclic style ${id}`);
    assert.ok(styles.has(id), `missing style ${id}`);
    seen.add(id);
    const s = styles.get(id);
    return [...chain(property(s, 'basedOn').val, seen), runProperties(s)];
  };
  function apply(state, props, direct = false) {
    const font = property(props, 'rFonts'), color = property(props, 'color');
    assert.ok(!Object.keys(font).some(k => /theme/i.test(k)), 'used font has a competing theme reference');
    assert.ok(!Object.keys(color).some(k => /^theme/.test(k)), 'used color has a competing theme reference');
    for (const key of ['ascii', 'hAnsi']) if (font[key]) state[key] = font[key];
    if (color.val) state.color = color.val;
    const bold = elements(props, 'b')[0];
    if (bold) {
      const on = !['0', 'false', 'off'].includes(attributes(bold).val);
      // Bold is a toggle in styles and an absolute value in direct formatting.
      if (direct) state.bold = on;
      else if (on) state.bold = !state.bold;
    }
    return state;
  }
  const resolve = (paragraphStyle, run) => {
    const state = apply({ bold: false }, defaults, true);
    for (const pr of chain(paragraphStyle || 'Normal')) apply(state, pr);
    for (const pr of chain(property(runProperties(run), 'rStyle').val)) apply(state, pr);
    return apply(state, runProperties(run), true);
  };
  return { styles, resolve, chain, apply };
}

test('populated semantic labels and descriptive option titles retain selective emphasis', () => {
  const zip = parts(fs.readFileSync(new URL('../../assets/templates/expert-consultation.docx', import.meta.url)));
  const model = formattingModel(zip), ps = elements(zip.get('word/document.xml'), 'p');
  const roles = ['OptionTitle', 'NoticeLabel', 'ContextLabel', 'QuestionLabel', 'ExampleLabel', 'RecommendationLabel', 'AssumptionLabel', 'AnswerLabel', 'CommentsLabel'];
  for (const role of roles) {
    const id = `Consultation${role}`;
    const applied = ps.flatMap(p => textRuns(p).filter(r => property(runProperties(r), 'rStyle').val === id).map(r => ({p,r})));
    assert.ok(applied.length, `${role} has a populated example`);
    assert.equal(attributes(model.styles.get(id)).type, 'character');
    for (const {p,r} of applied) assert.equal(model.resolve(property(p, 'pStyle').val, r).bold, true, `${role} is visibly bold`);
  }
  for (const p of ps) {
    const style = property(p, 'pStyle').val, runs = textRuns(p);
    if (/^[A-Z]\. /.test(paragraphText(p))) {
      assert.equal(style, 'ConsultationOption');
      assert.equal(property(runProperties(runs[0]), 'rStyle').val, 'ConsultationOptionTitle');
      assert.ok(paragraphText(runs[0]).replace(/^[A-Z]\.\s*/, '').trim().length > 0, 'title includes more than the option letter');
      assert.ok(runs.length > 1, 'option has an explanation');
      for (const r of runs.slice(1)) assert.equal(model.resolve(style, r).bold, false, 'option explanation remains regular');
    }
    if (['ReadyToAnswer','AnswerAfter','WaitingFor','DependencyReview'].includes(style)) {
      assert.equal(property(runProperties(runs[0]), 'rStyle').val, 'ConsultationNoticeLabel');
      assert.ok(runs.length > 1);
      for (const r of runs.slice(1)) assert.equal(model.resolve(style, r).bold, false, 'notice explanation remains regular');
    }
    if (style === 'ConsultationSupport') {
      assert.match(property(runProperties(runs[0]), 'rStyle').val || '', /^Consultation.+Label$/, 'support paragraph starts with its semantic label');
      assert.ok(runs.some(r => !model.resolve(style, r).bold), 'support body remains regular');
    }
  }
});

test('populated text and linked heading styles resolve to black Calibri', () => {
  const zip = parts(fs.readFileSync(new URL('../../assets/templates/expert-consultation.docx', import.meta.url)));
  const model = formattingModel(zip);
  for (const [name, xml] of zip) {
    if (!/^word\/(document|header\d+|footer\d+)\.xml$/.test(name)) continue;
    for (const p of elements(xml, 'p')) for (const r of textRuns(p)) {
      const effective = model.resolve(property(p, 'pStyle').val, r);
      assert.equal(effective.ascii, 'Calibri', `${name}: Latin font`);
      assert.equal(effective.hAnsi, 'Calibri', `${name}: extended Latin font`);
      assert.equal(effective.color, '000000', `${name}: text color`);
    }
  }
  for (const id of ['Title', 'Heading1', 'Heading2', 'Heading3']) {
    const linked = property(model.styles.get(id), 'link').val;
    assert.ok(linked, `${id} retains linked character style`);
    const effective = model.resolve('Normal', `<w:r><w:rPr><w:rStyle w:val="${linked}"/></w:rPr><w:t>Heading</w:t></w:r>`);
    assert.equal(effective.ascii, 'Calibri');
    assert.equal(effective.color, '000000');
    assert.equal(property(runProperties(model.styles.get(linked)), 'sz').val, property(runProperties(model.styles.get(id)), 'sz').val);
  }
});


test('a shared prerequisite appears once at ticket scope and identifies each question effect', () => {
  const zip = parts(fs.readFileSync(new URL('../../assets/templates/expert-consultation.docx', import.meta.url)));
  const ps = elements(zip.get('word/document.xml'), 'p');
  const style = p => property(p, 'pStyle').val;
  const ticket = p => elements(p, 'bookmarkStart').map(attributes).find(a => a.name?.startsWith('ticket_'))?.name;
  const shared = ps.findIndex(p => style(p) === 'AnswerAfter');
  assert.ok(shared > 1);
  assert.equal(style(ps[shared - 1]), 'ConsultationCount');
  assert.ok(ticket(ps[shared - 2]), 'shared notice is directly below a canonical ticket and count');
  const end = ps.findIndex((p, i) => i > shared && (ticket(p) || style(p) === 'Heading1'));
  const scope = ps.slice(shared, end < 0 ? undefined : end);
  const questions = scope.filter(p => style(p) === 'Heading3');
  assert.equal(questions.length, 2, 'example demonstrates a prerequisite shared by two questions');
  const notice = ps[shared], text = paragraphText(notice);
  const link = elements(notice, 'hyperlink')[0];
  const anchor = attributes(link).anchor;
  const target = ps.find(p => elements(p, 'bookmarkStart').some(b => attributes(b).name === anchor));
  assert.ok(target && ticket(target), 'shared prerequisite link targets its canonical ticket');
  const identity = paragraphText(target);
  assert.equal(paragraphText(link), identity, 'link names both ID and descriptive title');
  assert.equal(text.split(identity).length - 1, 1, 'identity is stated once in notice');
  assert.match(text, /page \d+ of this consultation/i);
  for (const question of questions) {
    const [, number, subject] = paragraphText(question).match(/^(\d+)\. (.+)$/);
    assert.ok(text.toLowerCase().includes(`question ${number}, ${subject}`.toLowerCase()), 'notice names each affected question by number and subject');
  }
  assert.match(text, /whether.+workstations or participants/i, 'confirmation choice explains the counting-unit consequence');
  assert.match(text, /whether.+workstation or.+participant count/i, 'cancellation choice explains the released-quantity consequence');
  assert.match(text, /conditional preferences|provisional input|examples now/i);
  assert.doesNotMatch(text, /both questions|after resolving it|answer later|click (?:its|the) code/i);
  const prerequisiteId = identity.match(/TICKET-\d+/)[0];
  const notices = scope.filter(p => ['AnswerAfter','WaitingFor','DependencyReview'].includes(style(p)));
  assert.equal(notices.filter(p => paragraphText(p).includes(prerequisiteId)).length, 1, 'shared prerequisite is not repeated beneath questions');
  assert.equal(notices.length, 1, 'no additional blocker is invented for the shared example');
});

test('question-specific conditions remain local and approved context is never a blocker', () => {
  const zip = parts(fs.readFileSync(new URL('../../assets/templates/expert-consultation.docx', import.meta.url)));
  const ps = elements(zip.get('word/document.xml'), 'p');
  const style = p => property(p, 'pStyle').val;
  for (const role of ['WaitingFor','DependencyReview']) {
    const i = ps.findIndex(p => style(p) === role);
    assert.equal(style(ps[i - 1]), 'Heading3', `${role} is adjacent to its affected question`);
  }
  const approved = ps.filter(p => /TICKET-\d+[^)]*approved/i.test(paragraphText(p)));
  assert.ok(approved.length >= 2, 'examples retain approved context for an answerable and a revision question');
  for (const p of approved) {
    assert.equal(style(p), 'ConsultationSupport');
    assert.ok(textRuns(p).some(r => property(runProperties(r), 'rStyle').val === 'ConsultationContextLabel'));
    const ids = paragraphText(p).match(/TICKET-\d+/g);
    for (const id of ids) for (const n of ps.filter(n => ['AnswerAfter','WaitingFor'].includes(style(n)))) {
      assert.ok(!paragraphText(n).includes(id), 'approved source is not presented as an unresolved prerequisite');
    }
  }
});
