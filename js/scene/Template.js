/**
 * 展厅模板类
 * 提供三种博物馆风格的展厅模板
 */
class Template {
  constructor(scene) {
    this.scene = scene;
    this.currentTemplate = null;
    this.walls = [];
    this.pedestals = [];
  }

  /**
   * 加载模板
   * @param {string} type - 模板类型：classical, modern, archaeological
   */
  load(type) {
    this.clear();
    this.currentTemplate = type;

    switch (type) {
      case 'classical':
        this.loadClassical();
        break;
      case 'modern':
        this.loadModern();
        break;
      case 'archaeological':
        this.loadArchaeological();
        break;
      default:
        this.loadModern();
    }
  }

  /**
   * 辅助：递归释放 Object3D 的几何体和材质
   */
  disposeObject(obj) {
    if (!obj) return;
    // 若是 Group，先递归子节点
    if (obj.isGroup || obj.children?.length) {
      obj.children.slice().forEach(child => this.disposeObject(child));
    }
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => m.dispose());
    }
  }

  /**
   * 清除当前模板
   */
  clear() {
    // 移除墙面
    this.walls.forEach(wall => {
      this.scene.remove(wall);
      this.disposeObject(wall);
    });
    this.walls = [];

    // 移除展台（兼容 Mesh 和 Group 玻璃展柜）
    this.pedestals.forEach(pedestal => {
      this.scene.remove(pedestal);
      this.disposeObject(pedestal);
    });
    this.pedestals = [];
  }

  /**
   * 古典博物馆风格
   * 暖色调墙面、木质展柜、柔和灯光
   */
  loadClassical() {
    // 墙面材质
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a574,
      roughness: 0.7,
      metalness: 0.1
    });

    // 创建四面墙
    this.createWall(0, 3, -5, 10, 6, 0.3, wallMaterial); // 后墙
    this.createWall(0, 3, 5, 10, 6, 0.3, wallMaterial);  // 前墙
    this.createWall(-5, 3, 0, 0.3, 6, 10, wallMaterial); // 左墙
    this.createWall(5, 3, 0, 0.3, 6, 10, wallMaterial);  // 右墙

    // 木质展台
    const pedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6914,
      roughness: 0.5,
      metalness: 0.3
    });

    // 创建展台
    this.createPedestal(-3, 0.5, 3, 0.8, 0.5, 0.8, pedestalMaterial);
    this.createPedestal(0, 0.5, 3, 0.8, 0.5, 0.8, pedestalMaterial);
    this.createPedestal(3, 0.5, 3, 0.8, 0.5, 0.8, pedestalMaterial);
    this.createPedestal(-3, 0.5, -3, 0.8, 0.5, 0.8, pedestalMaterial);
    this.createPedestal(3, 0.5, -3, 0.8, 0.5, 0.8, pedestalMaterial);

    // 添加柔和的聚光灯
    this.createSpotlight(0, 5.5, 0, 0, -1, 0, 0xffffff, 0.8, Math.PI / 6);
  }

  /**
   * 现代美术馆风格
   * 白色墙面、轨道射灯、简洁展台
   */
  loadModern() {
    // 墙面材质
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.8,
      metalness: 0.1
    });

    // 创建四面墙
    this.createWall(0, 3, -5, 10, 6, 0.3, wallMaterial);
    this.createWall(0, 3, 5, 10, 6, 0.3, wallMaterial);
    this.createWall(-5, 3, 0, 0.3, 6, 10, wallMaterial);
    this.createWall(5, 3, 0, 0.3, 6, 10, wallMaterial);

    // 简洁展台
    const pedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.6,
      metalness: 0.2
    });

    // 创建展台
    this.createPedestal(-2.5, 0.6, 2.5, 0.6, 0.6, 0.6, pedestalMaterial);
    this.createPedestal(2.5, 0.6, 2.5, 0.6, 0.6, 0.6, pedestalMaterial);
    this.createPedestal(-2.5, 0.6, -2.5, 0.6, 0.6, 0.6, pedestalMaterial);
    this.createPedestal(2.5, 0.6, -2.5, 0.6, 0.6, 0.6, pedestalMaterial);

    // 添加轨道射灯
    this.createSpotlight(-2, 5.5, 0, 0, -1, 0, 0xffffff, 1.0, Math.PI / 8);
    this.createSpotlight(2, 5.5, 0, 0, -1, 0, 0xffffff, 1.0, Math.PI / 8);
  }

  /**
   * 历史考古风格
   * 深色墙面、玻璃展柜、重点照明
   */
  loadArchaeological() {
    // 墙面材质
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9,
      metalness: 0.1
    });

    // 创建四面墙
    this.createWall(0, 3, -5, 10, 6, 0.3, wallMaterial);
    this.createWall(0, 3, 5, 10, 6, 0.3, wallMaterial);
    this.createWall(-5, 3, 0, 0.3, 6, 10, wallMaterial);
    this.createWall(5, 3, 0, 0.3, 6, 10, wallMaterial);

    // 玻璃展柜
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.1,
      transmission: 0.9,
      transparent: true,
      opacity: 0.3
    });

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c1810,
      roughness: 0.5,
      metalness: 0.3
    });

    // 创建玻璃展柜
    this.createGlassCase(-3, 0, 3, 1.2, 1, 0.8, baseMaterial, glassMaterial);
    this.createGlassCase(0, 0, 3, 1.2, 1, 0.8, baseMaterial, glassMaterial);
    this.createGlassCase(3, 0, 3, 1.2, 1, 0.8, baseMaterial, glassMaterial);

    // 添加重点照明
    this.createSpotlight(-3, 5.5, 3, 0, -1, 0, 0xffeedd, 1.2, Math.PI / 6);
    this.createSpotlight(0, 5.5, 3, 0, -1, 0, 0xffeedd, 1.2, Math.PI / 6);
    this.createSpotlight(3, 5.5, 3, 0, -1, 0, 0xffeedd, 1.2, Math.PI / 6);
  }

  /**
   * 创建墙面
   */
  createWall(x, y, z, width, height, depth, material) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
    this.walls.push(wall);
    return wall;
  }

  /**
   * 创建展台
   */
  createPedestal(x, y, z, width, height, depth, material) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const pedestal = new THREE.Mesh(geometry, material);
    pedestal.position.set(x, y, z);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);
    this.pedestals.push(pedestal);
    return pedestal;
  }

  /**
   * 创建玻璃展柜
   */
  createGlassCase(x, y, z, width, height, depth, baseMaterial, glassMaterial) {
    const group = new THREE.Group();

    // 底座
    const baseGeometry = new THREE.BoxGeometry(width, 0.2, depth);
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // 玻璃罩（简化为四个面）
    const halfW = width / 2 - 0.05;
    const halfD = depth / 2 - 0.05;
    const glassHeight = height - 0.2;

    // 前后面
    const frontBackGeo = new THREE.PlaneGeometry(width, glassHeight);
    const front = new THREE.Mesh(frontBackGeo, glassMaterial);
    front.position.set(0, 0.1 + glassHeight / 2, halfD);
    group.add(front);

    const back = new THREE.Mesh(frontBackGeo, glassMaterial);
    back.position.set(0, 0.1 + glassHeight / 2, -halfD);
    back.rotation.y = Math.PI;
    group.add(back);

    // 左右面
    const sideGeo = new THREE.PlaneGeometry(depth, glassHeight);
    const left = new THREE.Mesh(sideGeo, glassMaterial);
    left.position.set(-halfW, 0.1 + glassHeight / 2, 0);
    left.rotation.y = Math.PI / 2;
    group.add(left);

    const right = new THREE.Mesh(sideGeo, glassMaterial);
    right.position.set(halfW, 0.1 + glassHeight / 2, 0);
    right.rotation.y = -Math.PI / 2;
    group.add(right);

    // 顶部
    const topGeo = new THREE.PlaneGeometry(width, depth);
    const top = new THREE.Mesh(topGeo, glassMaterial);
    top.position.set(0, 0.1 + glassHeight, 0);
    top.rotation.x = Math.PI / 2;
    group.add(top);

    group.position.set(x, y, z);
    this.scene.add(group);
    this.pedestals.push(group);
    return group;
  }

  /**
   * 创建聚光灯
   */
  createSpotlight(x, y, z, targetX, targetY, targetZ, color, intensity, angle) {
    const spotlight = new THREE.SpotLight(color, intensity);
    spotlight.position.set(x, y, z);
    spotlight.target.position.set(targetX, targetY, targetZ);
    spotlight.angle = angle;
    spotlight.penumbra = 0.3;
    spotlight.castShadow = true;
    this.scene.add(spotlight);
    this.scene.add(spotlight.target);
    return spotlight;
  }

  /**
   * 获取墙面位置列表（用于 AI 布局）
   */
  getWallPositions() {
    const positions = [];
    
    // 后墙
    for (let x = -4; x <= 4; x += 2) {
      positions.push({ x, y: 2, z: -4.8, normal: new THREE.Vector3(0, 0, 1) });
      positions.push({ x, y: 4, z: -4.8, normal: new THREE.Vector3(0, 0, 1) });
    }
    
    // 前墙
    for (let x = -4; x <= 4; x += 2) {
      positions.push({ x, y: 2, z: 4.8, normal: new THREE.Vector3(0, 0, -1) });
      positions.push({ x, y: 4, z: 4.8, normal: new THREE.Vector3(0, 0, -1) });
    }
    
    // 左墙
    for (let z = -4; z <= 4; z += 2) {
      positions.push({ x: -4.8, y: 2, z, normal: new THREE.Vector3(1, 0, 0) });
      positions.push({ x: -4.8, y: 4, z, normal: new THREE.Vector3(1, 0, 0) });
    }
    
    // 右墙
    for (let z = -4; z <= 4; z += 2) {
      positions.push({ x: 4.8, y: 2, z, normal: new THREE.Vector3(-1, 0, 0) });
      positions.push({ x: 4.8, y: 4, z, normal: new THREE.Vector3(-1, 0, 0) });
    }
    
    return positions;
  }

  /**
   * 获取展台位置列表（用于 AI 布局）
   */
  getPedestalPositions() {
    return this.pedestals.map(p => {
      // 兼容 Mesh 和 Group（玻璃展柜）
      const pos = p.position || { x: 0, y: 0, z: 0 };
      return {
        x: pos.x,
        y: pos.y + 0.6,
        z: pos.z
      };
    });
  }
}
