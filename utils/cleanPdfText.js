export function cleanPdfText(text, maxChars = 8000) {
  return text
    .replace(/[ \t]+/g, ' ')          // normalize spaces/tabs to single space
    .replace(/\n{3,}/g, '\n\n')        // collapse 3+ newlines to 2
    .replace(/[^\x20-\x7E\n]/g, ' ')  // strip non-printable chars
    .trim()
    .slice(0, maxChars);
}
