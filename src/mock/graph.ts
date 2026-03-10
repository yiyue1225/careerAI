export const graphData = {
  nodes: [
    { id: '1', name: 'Java开发工程师', category: '初级' },
    { id: '2', name: '高级Java开发', category: '高级' },
    { id: '3', name: '技术主管', category: '管理' },
    { id: '4', name: '架构师', category: '高级' },
    { id: '5', name: '大数据开发', category: '换岗' },
    { id: '6', name: '前端开发', category: '换岗' },
    { id: '7', name: '产品经理', category: '换岗' },
  ],
  links: [
    { source: '1', target: '2', type: 'promotion' },
    { source: '2', target: '3', type: 'promotion' },
    { source: '2', target: '4', type: 'promotion' },
    { source: '1', target: '5', type: 'transfer' },
    { source: '1', target: '6', type: 'transfer' },
    { source: '1', target: '7', type: 'transfer' },
    { source: '6', target: '产品经理', type: 'transfer' },
  ],
}