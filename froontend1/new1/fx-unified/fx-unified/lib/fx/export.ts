import type { Project } from './types'

function download(name: string, text: string, type: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

const slug = (s: string) => (s || 'fx-project').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')

export function exportJson(p: Project) {
  download(`${slug(p.brief.project)}.json`, JSON.stringify(p, null, 2), 'application/json')
}

export function exportMarkdown(p: Project) {
  const b = p.brief
  const idea = p.ideas.find((i) => i.id === p.selectedIdeaId)
  const s = p.strategy
  const md = [
    `# ${b.project}`,
    `## Brief\n- Brand: ${b.brand}\n- Product: ${b.product}\n- Objective: ${b.objective}\n- Audience: ${b.audience}\n- Challenge: ${b.challenge}\n- Context: ${b.context}\n- Requirements: ${b.requirements}`,
    s &&
      `## Strategy\n**Insight:** ${s.insight}\n\n**Audience insight:** ${s.audienceInsight}\n\n**Tension:** ${s.tension}\n\n**Opportunity:** ${s.opportunity}\n\n**Territory:** ${s.territory}\n\n**Direction:** ${s.direction}`,
    idea &&
      `## Big idea — ${idea.bigIdea}\n> ${idea.hook}\n\n${idea.message}\n\n- Theme: ${idea.theme}\n- Territory: ${idea.territory}\n- Engine: ${idea.engine}`,
    p.script &&
      `## Script — ${p.script.title}\n_${p.script.logline}_\n\n` +
        p.script.scenes
          .map(
            (sc, n) =>
              `### ${n + 1}. ${sc.scene} (${sc.duration}s)\n- Action: ${sc.action}\n- Visual: ${sc.visual}\n- Camera: ${sc.camera}\n- Dialogue: ${sc.dialogue}\n- Voiceover: ${sc.voiceover}\n- Music: ${sc.music}\n- Sound: ${sc.sound}`,
          )
          .join('\n\n'),
  ]
    .filter(Boolean)
    .join('\n\n')
  download(`${slug(b.project)}.md`, md, 'text/markdown')
}
