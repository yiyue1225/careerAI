export interface Position {
  id: string
  name: string
  company: string
  industry: string
  salary: string
  location: string
  description: string
  requirements: {
    professionalSkills: string[]
    certificates: string[]
    innovation: number
    learningAbility: number
    stressTolerance: number
    communication: number
    internship: string[]
  }
  dimensions: {
    professional: number
    certificate: number
    innovation: number
    learning: number
    stress: number
    communication: number
    internship: number
  }
}

export const positions: Position[] = [
  {
    id: '1',
    name: 'Java开发工程师',
    company: '某科技公司',
    industry: '互联网',
    salary: '15-25K',
    location: '北京',
    description: '负责后端服务开发，参与系统架构设计...',
    requirements: {
      professionalSkills: ['Java', 'Spring Boot', 'MySQL', 'Redis'],
      certificates: ['计算机等级考试二级Java', 'Oracle认证优先'],
      innovation: 4,
      learningAbility: 4,
      stressTolerance: 4,
      communication: 3,
      internship: ['有实际项目经验优先'],
    },
    dimensions: {
      professional: 90,
      certificate: 60,
      innovation: 70,
      learning: 80,
      stress: 75,
      communication: 65,
      internship: 50,
    },
  },
  {
    id: '2',
    name: '前端开发工程师',
    company: '某互联网公司',
    industry: '互联网',
    salary: '14-24K',
    location: '上海',
    description: '负责Web前端页面开发，优化用户体验...',
    requirements: {
      professionalSkills: ['HTML5', 'CSS3', 'JavaScript', 'Vue/React'],
      certificates: [],
      innovation: 4,
      learningAbility: 5,
      stressTolerance: 3,
      communication: 4,
      internship: ['有组件库开发经验优先'],
    },
    dimensions: {
      professional: 85,
      certificate: 30,
      innovation: 80,
      learning: 90,
      stress: 60,
      communication: 70,
      internship: 60,
    },
  },
  // 你可以继续添加更多岗位，至少10个。这里为了简洁，只列2个。
]

export const getPositionById = (id: string) => positions.find(p => p.id === id)