/** Native GBS Mono dialogue: 20 screen tiles minus the two frame columns.
 * Variables stay intact in authored text, but occupy their worst rendered width.
 */
export const DIALOGUE_COLUMNS = 18;
export const DIALOGUE_LINES = 5;
const tokenPattern = /\$[A-Za-z0-9_]+\$|[\s\S]/g;

function optionsWithDefaults(options = {}) {
  const result = { columns: DIALOGUE_COLUMNS, linesPerPage: DIALOGUE_LINES,
    defaultVariableWidth: 6, variableWidths: {}, ...options };
  for (const name of ['columns', 'linesPerPage', 'defaultVariableWidth']) {
    if (!Number.isInteger(result[name]) || result[name] < 1) throw Error(`Invalid ${name}`);
  }
  return result;
}
function tokens(text, options) {
  if (typeof text !== 'string') throw Error('Dialogue page must be a string');
  if (/[^\x20-\x7e\n]/.test(text)) throw Error('Dialogue must use printable ASCII and newline');
  return [...text.matchAll(tokenPattern)].map(([value]) => {
    const variable = /^\$([A-Za-z0-9_]+)\$$/.exec(value);
    const width = variable ? (options.variableWidths[variable[1]] ?? options.defaultVariableWidth) : 1;
    if (!Number.isInteger(width) || width < 1) throw Error(`Invalid width for ${value}`);
    return { value, width };
  });
}
export function renderedWidth(text, options = {}) {
  const opts = optionsWithDefaults(options);
  if (text.includes('\n')) throw Error('renderedWidth expects one line');
  return tokens(text, opts).reduce((sum, token) => sum + token.width, 0);
}

/** Preserve explicit line and page boundaries; add wrapping and pages as needed.
 * Whitespace separating words becomes one space, never split a runtime token.
 * A word longer than the box is split losslessly, character by character.
 */
export function layoutDialogue(input, options = {}) {
  const opts = optionsWithDefaults(options);
  const pages = Array.isArray(input) ? input : [input];
  return pages.flatMap(page => {
    tokens(page, opts); // Validate even empty lines and whitespace.
    const lines = page.split('\n').flatMap(explicitLine => {
      const result = [];
      let line = '', width = 0;
      const flush = () => { result.push(line); line = ''; width = 0; };
      for (const word of explicitLine.split(/ +/).filter(Boolean)) {
        const pieces = tokens(word, opts);
        const wordWidth = pieces.reduce((sum, token) => sum + token.width, 0);
        if (width && width + 1 + wordWidth <= opts.columns) { line += ' '; width++; }
        else if (width) flush();
        for (const token of pieces) {
          if (token.width > opts.columns) throw Error(`Runtime token ${token.value} exceeds dialogue width`);
          if (width + token.width > opts.columns) flush();
          line += token.value;
          width += token.width;
        }
      }
      if (line || !result.length) flush();
      return result;
    });
    const result = [];
    for (let i = 0; i < lines.length; i += opts.linesPerPage) {
      result.push(lines.slice(i, i + opts.linesPerPage).join('\n'));
    }
    return result;
  });
}

export function dialogueProblems(input, options = {}) {
  const opts = optionsWithDefaults(options), problems = [];
  const pages = Array.isArray(input) ? input : [input];
  pages.forEach((page, pageIndex) => {
    try {
      const lines = page.split('\n');
      if (lines.length > opts.linesPerPage) problems.push(`page ${pageIndex + 1}: ${lines.length} lines, maximum ${opts.linesPerPage}`);
      lines.forEach((line, lineIndex) => {
        const width = renderedWidth(line, opts);
        if (width > opts.columns) problems.push(`page ${pageIndex + 1} line ${lineIndex + 1}: ${width} glyphs, maximum ${opts.columns}: ${line}`);
      });
    } catch (error) { problems.push(`page ${pageIndex + 1}: ${error.message}`); }
  });
  return problems;
}

/** Widths keyed by native variable ID. Unknown variables use six signed characters (including -32768).
 * The game keeps coins below 10000 and stored scrap below 100.
 */
export function gameVariableWidths(variables) {
  const widths = { coins: 4, salvage: 2, cheer: 3, district_count: 1, carried: 2 };
  return Object.fromEntries(variables.map(variable => [String(variable.id), widths[variable.name.replaceAll(' ', '_')] ?? 6]));
}
