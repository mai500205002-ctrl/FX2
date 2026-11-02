import type { BriefField, Locale } from './types'

/** Sentence starters that help strategists write sharper briefs, per field. */
export const briefSuggestions: Record<Locale, Partial<Record<BriefField, string[]>>> = {
  ar: {
    objective: [
      'بعد الحملة، يجب أن يشعر الجمهور بأن...',
      'نقيس النجاح بتحوّل في السلوك: من ... إلى ...',
    ],
    audience: [
      'ما يعتقدونه الآن: ...',
      'لحظة في يومهم نريد أن نكون فيها: ...',
    ],
    challenge: [
      'العائق ليس المنتج، بل التصور بأن...',
      'المنافس الحقيقي هو العادة، لا العلامة الأخرى.',
    ],
    context: [
      'التحول الثقافي الذي نركبه: ...',
      'ما يقوله المنافسون جميعاً، وما لا يجرؤ أحد على قوله: ...',
    ],
    requirements: [
      'ممنوعات إبداعية: ...',
      'المخرجات: فيلم رئيسي، نسخ ٦ ثوانٍ، محتوى عمودي.',
    ],
  },
  en: {
    objective: [
      'After the campaign, the audience should feel that…',
      'We measure success as a shift in behavior: from … to …',
    ],
    audience: [
      'What they believe today: …',
      'A moment in their day we want to own: …',
    ],
    challenge: [
      "The barrier isn't the product, it's the perception that…",
      'The real competitor is habit, not another brand.',
    ],
    context: [
      'The cultural shift we can ride: …',
      'What every competitor says, and what no one dares to say: …',
    ],
    requirements: [
      'Creative no-gos: …',
      'Deliverables: hero film, 6s cut-downs, vertical content.',
    ],
  },
}
