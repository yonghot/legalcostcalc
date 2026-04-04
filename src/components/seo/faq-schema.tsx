interface FaqSchemaProps {
  questions: { question: string; answer: string }[];
}

/**
 * Sanitize a JSON-LD string to prevent script injection.
 * Escaping `</` prevents a `</script>` inside the JSON blob
 * from closing the surrounding <script> tag.
 */
function safeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export function FaqSchema({ questions }: FaqSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
