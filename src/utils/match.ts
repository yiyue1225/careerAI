/**
 * 共享人岗匹配度计算工具
 *
 * 算法：相对缺口惩罚法
 * - 仅惩罚「学生低于岗位要求」的部分（不奖励超出）
 * - 惩罚是相对的：缺口 / 岗位要求，而非绝对差值
 * - 这样低要求岗位不会因为绝对分值低就被误判为高匹配
 *
 * 对比旧算法 `100 - avg(|s-j|)`：
 *   旧：student=20, job=30 → gap=10 → match=90%（明显虚高）
 *   新：student=20, job=30 → deficit=10/30=33% → match=67%（更真实）
 */
export const DIMS = [
  'professional', 'certificate', 'innovation',
  'learning', 'stress', 'communication', 'internship'
] as const

export type DimKey = typeof DIMS[number]

export const DIM_LABELS: Record<DimKey, string> = {
  professional: '专业技能',
  certificate:  '证书',
  innovation:   '创新能力',
  learning:     '学习能力',
  stress:       '抗压能力',
  communication:'沟通能力',
  internship:   '实习经验',
}

/**
 * 计算匹配度（0-100）
 * @param studentDims 学生各维度得分
 * @param jobDims     岗位各维度要求
 */
export function calcMatchScore(
  studentDims: Record<string, number>,
  jobDims: Record<string, number>
): number {
  let totalPenalty = 0
  let count = 0

  DIMS.forEach(d => {
    const s = studentDims[d] || 0
    const j = jobDims[d] || 0
    if (j > 5) { // 忽略要求极低（≤5）的维度，避免分母趋零
      const deficit = Math.max(0, j - s)
      totalPenalty += deficit / j  // 相对缺口 0~1
      count++
    }
  })

  if (count === 0) return 60 // 岗位无有效维度数据，给中间分
  const avgPenalty = totalPenalty / count
  return Math.round(Math.max(0, Math.min(100, (1 - avgPenalty) * 100)))
}

/** 匹配度对应 Element Plus tag 类型 */
export function getMatchTagType(score: number): 'success' | 'warning' | 'danger' | '' {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}
