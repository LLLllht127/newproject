/**
 * AI 布局算法类
 * 自动分析展品并智能分配到墙面和展台位置
 */
class AILayout {
  constructor(scene, template) {
    this.scene = scene;
    this.template = template;
  }

  /**
   * 执行 AI 布局
   * @param {Array} exhibits - 展品列表
   */
  layout(exhibits) {
    if (!exhibits || exhibits.length === 0) {
      console.log('没有展品需要布局');
      return;
    }

    // 获取可用位置
    const wallPositions = this.template.getWallPositions();
    const pedestalPositions = this.template.getPedestalPositions();

    // 分类展品
    const wallExhibits = [];
    const pedestalExhibits = [];

    exhibits.forEach((exhibit, index) => {
      // 根据展品类型或索引分配
      if (exhibit.type === 'wall' || index % 3 !== 0) {
        wallExhibits.push(exhibit);
      } else {
        pedestalExhibits.push(exhibit);
      }
    });

    // 如果展台展品过多，调整分配
    if (pedestalExhibits.length > pedestalPositions.length) {
      const excess = pedestalExhibits.splice(
        pedestalPositions.length,
        pedestalExhibits.length - pedestalPositions.length
      );
      wallExhibits.push(...excess);
    }

    // 如果墙面展品过多，调整分配
    if (wallExhibits.length > wallPositions.length) {
      const excess = wallExhibits.splice(
        wallPositions.length,
        wallExhibits.length - wallPositions.length
      );
      if (pedestalExhibits.length < pedestalPositions.length) {
        pedestalExhibits.push(...excess);
      }
    }

    // 应用布局
    this.applyWallLayout(wallExhibits, wallPositions);
    this.applyPedestalLayout(pedestalExhibits, pedestalPositions);
  }

  /**
   * 应用墙面布局
   */
  applyWallLayout(exhibits, positions) {
    if (exhibits.length === 0 || positions.length === 0) return;

    // 按墙面分组位置
    const wallGroups = {
      back: [],   // 后墙 (z = -4.8)
      front: [],  // 前墙 (z = 4.8)
      left: [],   // 左墙 (x = -4.8)
      right: []   // 右墙 (x = 4.8)
    };

    positions.forEach(pos => {
      if (pos.z === -4.8) wallGroups.back.push(pos);
      else if (pos.z === 4.8) wallGroups.front.push(pos);
      else if (pos.x === -4.8) wallGroups.left.push(pos);
      else if (pos.x === 4.8) wallGroups.right.push(pos);
    });

    // 计算每面墙应该分配的展品数量
    const totalExhibits = exhibits.length;
    const totalPositions = positions.length;
    
    // 优先分配后墙和前墙
    const distribution = this.distributeExhibitsToWalls(exhibits, wallGroups);

    // 应用位置
    let exhibitIndex = 0;
    
    ['back', 'front', 'left', 'right'].forEach(wallName => {
      const wallExhibits = distribution[wallName];
      const wallPositions = wallGroups[wallName];
      
      wallExhibits.forEach((exhibit, i) => {
        if (i < wallPositions.length) {
          const pos = wallPositions[i];
          this.placeExhibit(exhibit, pos);
        }
      });
    });
  }

  /**
   * 分配展品到各墙面
   */
  distributeExhibitsToWalls(exhibits, wallGroups) {
    const distribution = {
      back: [],
      front: [],
      left: [],
      right: []
    };

    const wallOrder = ['back', 'front', 'left', 'right'];
    const totalPositions = Object.values(wallGroups).reduce((sum, arr) => sum + arr.length, 0);
    
    // 计算每面墙的比例
    let remaining = [...exhibits];
    
    wallOrder.forEach(wallName => {
      const wallCapacity = wallGroups[wallName].length;
      const ratio = wallCapacity / totalPositions;
      const count = Math.min(
        Math.ceil(exhibits.length * ratio),
        wallCapacity,
        remaining.length
      );
      
      distribution[wallName] = remaining.splice(0, count);
    });

    // 如果还有剩余，分配到容量最大的墙
    if (remaining.length > 0) {
      const maxWall = wallOrder.reduce((max, wall) => {
        const available = wallGroups[wall].length - distribution[wall].length;
        return available > (wallGroups[max].length - distribution[max].length) ? wall : max;
      }, 'back');
      
      distribution[maxWall].push(...remaining);
    }

    return distribution;
  }

  /**
   * 应用展台布局
   */
  applyPedestalLayout(exhibits, positions) {
    if (exhibits.length === 0 || positions.length === 0) return;

    // 沿参观动线分布（顺时针）
    const sortedPositions = [...positions].sort((a, b) => {
      // 按角度排序，形成顺时针参观路线
      const angleA = Math.atan2(a.x, a.z);
      const angleB = Math.atan2(b.x, b.z);
      return angleA - angleB;
    });

    exhibits.forEach((exhibit, i) => {
      if (i < sortedPositions.length) {
        const pos = sortedPositions[i];
        this.placeExhibit(exhibit, pos);
      }
    });
  }

  /**
   * 放置展品到指定位置
   */
  placeExhibit(exhibit, position) {
    if (!exhibit || !exhibit.mesh) return;

    // 设置位置
    exhibit.mesh.position.set(position.x, position.y, position.z);

    // 设置朝向（面向展厅中心）
    if (position.normal) {
      exhibit.mesh.lookAt(
        position.x + position.normal.x,
        position.y,
        position.z + position.normal.z
      );
    } else {
      // 展台展品面向中心
      exhibit.mesh.lookAt(0, position.y, 0);
    }
  }

  /**
   * 计算最优布局（高级 AI 功能）
   * 考虑展品大小、重要性等因素
   */
  calculateOptimalLayout(exhibits) {
    // 分析展品
    const analysis = exhibits.map(exhibit => {
      // 这里可以分析图片内容、尺寸等
      // 简化版本：随机分配重要性
      return {
        exhibit: exhibit,
        importance: Math.random(), // 实际可以基于图片分析
        size: exhibit.scale.x
      };
    });

    // 按重要性排序
    analysis.sort((a, b) => b.importance - a.importance);

    // 重要展品放在视觉焦点位置
    return analysis.map((item, index) => {
      return {
        exhibit: item.exhibit,
        priority: index
      };
    });
  }
}
