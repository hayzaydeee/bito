/**
 * Verbosity directives — *How much* Bito says.
 * Controls summary length and insight card depth.
 */

const verbosityDirectives = {
  concise: `Keep it tight. Summary should be 2–3 sentences max. Each insight card \
body should be a single sentence with one clear takeaway. If you can say it \
in fewer words, do.`,

  detailed: `Give context. Summary can run 3–4 sentences. Insight card bodies can \
be 2–3 sentences — explain why the pattern matters, not just that it exists. \
The user wants to understand, not just be told.`,
};

module.exports = { verbosityDirectives };
