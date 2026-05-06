/**
 * 3D 场景管理类
 * 负责 Three.js 场景的创建、渲染和交互
 */

// 使用全局 THREE 对象（通过 importmap 加载）
class Scene3D {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.exhibits = [];
    this.selectedExhibit = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isDragging = false;
    this.dragPlane = null;
    this.dragOffset = new THREE.Vector3();
    
    this.init();
    this.animate();
  }

  /**
   * 初始化场景
   */
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a15);
    this.scene.fog = new THREE.Fog(0x0a0a15, 10, 50);

    // 获取容器真实尺寸（fallback 到 window 防止容器尚未布局）
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    this.camera.position.set(0, 1.6, 8);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // canvas 填满容器
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器（兼容 CDN 加载的 OrbitControls 命名空间）
    const OrbitControlsCls =
      (typeof THREE !== 'undefined' && typeof THREE.OrbitControls !== 'undefined')
        ? THREE.OrbitControls
        : (typeof OrbitControls !== 'undefined' ? OrbitControls : null);
    if (!OrbitControlsCls) {
      console.error('OrbitControls 未加载，请检查 CDN 引用');
      // 创建假控制器避免后续崩溃
      this.controls = { update: () => {}, enableDamping: false };
    } else {
      this.controls = new OrbitControlsCls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
      this.controls.minDistance = 1;
      this.controls.maxDistance = 20;
      this.controls.target.set(0, 1.6, 0);
    }

    // 添加灯光
    this.setupLights();

    // 添加地面
    this.addFloor();

    // 绑定事件
    this.bindEvents();

    // 延迟 100ms 再 resize 一次，确保 flex 布局计算完毕
    setTimeout(() => this.onResize(), 100);
  }

  /**
   * 设置灯光
   */
  setupLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // 主方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);

    // 补光
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  /**
   * 添加地面
   */
  addFloor() {
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(20, 20, 0x333355, 0x222244);
    this.scene.add(gridHelper);
  }

  /**
   * 绑定交互事件
   */
  bindEvents() {
    window.addEventListener('resize', () => this.onResize());
    
    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
  }

  /**
   * 窗口大小调整
   */
  onResize() {
    if (!this.container) return;
    
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    if (width === 0 || height === 0) return;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * 鼠标按下事件
   */
  onMouseDown(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // 检测展品点击
    const exhibitMeshes = this.exhibits.map(e => e.mesh);
    const intersects = this.raycaster.intersectObjects(exhibitMeshes, true);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      const exhibit = this.exhibits.find(e => e.mesh === hitObject || e.mesh.children.includes(hitObject));
      
      if (exhibit) {
        this.selectExhibit(exhibit);
        this.isDragging = true;
        
        // 创建拖拽平面
        this.dragPlane = new THREE.Plane(
          this.camera.position.clone().sub(exhibit.mesh.position).normalize(),
          -exhibit.mesh.position.clone().dot(this.camera.position.clone().sub(exhibit.mesh.position).normalize())
        );
        
        const point = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.dragPlane, point);
        this.dragOffset.subVectors(exhibit.mesh.position, point);
      }
    } else {
      this.deselectExhibit();
    }
  }

  /**
   * 鼠标移动事件
   */
  onMouseMove(event) {
    if (!this.isDragging || !this.selectedExhibit) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const point = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.dragPlane, point)) {
      point.add(this.dragOffset);
      // 限制在地面上方
      point.y = Math.max(0.1, point.y);
      this.selectedExhibit.mesh.position.copy(point);
      this.updateExhibitPanel();
    }
  }

  /**
   * 鼠标松开事件
   */
  onMouseUp() {
    this.isDragging = false;
    this.dragPlane = null;
  }

  /**
   * 双击事件 - 聚焦展品
   */
  onDoubleClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const exhibitMeshes = this.exhibits.map(e => e.mesh);
    const intersects = this.raycaster.intersectObjects(exhibitMeshes, true);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      const exhibit = this.exhibits.find(e => e.mesh === hitObject || e.mesh.children.includes(hitObject));
      
      if (exhibit) {
        // 移动到展品前方
        const offset = new THREE.Vector3(0, 1.6, 3);
        const targetPos = exhibit.mesh.position.clone().add(offset);
        this.camera.position.copy(targetPos);
        this.controls.target.copy(exhibit.mesh.position);
      }
    }
  }

  /**
   * 选择展品
   */
  selectExhibit(exhibit) {
    this.deselectExhibit();
    this.selectedExhibit = exhibit;
    
    // 高亮显示（仅对 Mesh 有效，Group 跳过材质操作）
    if (exhibit.highlightMaterial && exhibit.mesh && exhibit.mesh.isMesh) {
      exhibit.mesh.material = exhibit.highlightMaterial;
    }
    
    // 触发回调
    if (this.onSelectCallback) {
      this.onSelectCallback(exhibit);
    }
  }

  /**
   * 取消选择展品
   */
  deselectExhibit() {
    if (this.selectedExhibit) {
      if (this.selectedExhibit.originalMaterial && this.selectedExhibit.mesh && this.selectedExhibit.mesh.isMesh) {
        this.selectedExhibit.mesh.material = this.selectedExhibit.originalMaterial;
      }
      this.selectedExhibit = null;
    }
    
    if (this.onDeselectCallback) {
      this.onDeselectCallback();
    }
  }

  /**
   * 设置选择回调
   */
  setOnSelectCallback(callback) {
    this.onSelectCallback = callback;
  }

  /**
   * 设置取消选择回调
   */
  setOnDeselectCallback(callback) {
    this.onDeselectCallback = callback;
  }

  /**
   * 更新属性面板
   */
  updateExhibitPanel() {
    if (this.onUpdatePanelCallback) {
      this.onUpdatePanelCallback(this.selectedExhibit);
    }
  }

  /**
   * 设置面板更新回调
   */
  setOnUpdatePanelCallback(callback) {
    this.onUpdatePanelCallback = callback;
  }

  /**
   * 获取展厅配置
   */
  getConfig() {
    return {
      exhibits: this.exhibits.map(e => e.getData())
    };
  }

  /**
   * 加载展厅配置
   */
  loadConfig(config) {
    this.clearExhibits();
    
    if (config.exhibits) {
      config.exhibits.forEach(data => {
        this.addExhibit(data);
      });
    }
  }

  /**
   * 清除所有展品
   */
  clearExhibits() {
    while (this.exhibits.length > 0) {
      this.removeExhibit(this.exhibits[0]);
    }
  }

  /**
   * 添加展品到场景
   */
  addExhibit(exhibitData) {
    const exhibit = new Exhibit(exhibitData);
    exhibit.addToScene(this.scene);
    this.exhibits.push(exhibit);
    return exhibit;
  }

  /**
   * 移除展品
   */
  removeExhibit(exhibit) {
    exhibit.removeFromScene(this.scene);
    const index = this.exhibits.indexOf(exhibit);
    if (index > -1) {
      this.exhibits.splice(index, 1);
    }
    if (this.selectedExhibit === exhibit) {
      this.selectedExhibit = null;
    }
  }

  /**
   * 渲染循环
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.controls && typeof this.controls.update === 'function') {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }
}
