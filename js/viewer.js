/**
 * 漫游查看器
 * 第一人称视角探索展厅
 */
class Viewer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.template = null;
    this.exhibits = [];
    this.config = null;
    
    // 第一人称控制
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.prevTime = performance.now();
    this.isLocked = false; // 指针锁定状态
    
    // 展品交互
    this.raycaster = new THREE.Raycaster();
    this.showingCard = false;
    this.currentExhibit = null;
    
    this.init();
  }

  /**
   * 初始化查看器
   */
  init() {
    // 加载配置
    this.loadConfig();

    // 创建场景
    this.createScene();

    // 创建模板
    this.template = new Template(this.scene);
    if (this.config && this.config.template) {
      this.template.load(this.config.template);
    } else {
      this.template.load('modern');
    }

    // 加载展品
    this.loadExhibits();

    // 设置控制
    this.setupControls();

    // 绑定 UI 事件
    this.bindEvents();

    // 开始渲染循环
    this.animate();

    // 隐藏加载遮罩
    setTimeout(() => {
      const mask = document.getElementById('loadingMask');
      if (mask) {
        mask.classList.add('hidden');
        setTimeout(() => mask.remove(), 600);
      }
    }, 400);
  }

  /**
   * 加载配置
   */
  loadConfig() {
    // 1. 检查 URL 哈希数据
    this.config = URLCodec.getFromURL();
    
    if (this.config) {
      console.log('从 URL 加载配置');
      return;
    }

    // 2. 检查预览模式
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview')) {
      const previewConfig = sessionStorage.getItem('preview_config');
      if (previewConfig) {
        this.config = JSON.parse(previewConfig);
        console.log('从预览加载配置');
        return;
      }
    }

    // 3. 默认配置
    this.config = {
      template: 'modern',
      exhibits: []
    };
  }

  /**
   * 创建场景
   */
  createScene() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a15);
    this.scene.fog = new THREE.Fog(0x0a0a15, 10, 50);

    // 相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.6, 6);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    document.getElementById('scene3d').appendChild(this.renderer.domElement);

    // 灯光
    this.setupLights();

    // 地面
    this.addFloor();

    // 窗口大小调整
    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * 设置灯光
   */
  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  /**
   * 添加地面
   */
  addFloor() {
    // 地面
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

    // 天花板
    const ceilGeometry = new THREE.PlaneGeometry(20, 20);
    const ceilMaterial = new THREE.MeshStandardMaterial({
      color: 0x111122,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.BackSide
    });
    const ceiling = new THREE.Mesh(ceilGeometry, ceilMaterial);
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.position.y = 6;
    this.scene.add(ceiling);
  }

  /**
   * 加载展品
   */
  loadExhibits() {
    if (!this.config || !this.config.exhibits) return;

    this.config.exhibits.forEach(data => {
      const exhibit = new Exhibit(data);
      exhibit.addToScene(this.scene);
      this.exhibits.push(exhibit);
    });
  }

  /**
   * 设置控制
   */
  setupControls() {
    const canvas = this.renderer.domElement;

    // 点击画布锁定指针
    canvas.addEventListener('click', () => {
      if (!this.isLocked) {
        canvas.requestPointerLock();
      }
    });

    // 指针锁定状态变化
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === canvas;
      this.updatePointerLockHint();
      // 显示/隐藏准星
      const crosshair = document.getElementById('crosshair');
      if (crosshair) crosshair.style.display = this.isLocked ? 'block' : 'none';
    });

    // 键盘事件
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));

    // 鼠标移动（旋转视角）
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // ESC 键显示提示
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isLocked) {
        // 指针会自动解锁，提示会显示
      }
    });
  }

  /**
   * 键盘按下事件
   */
  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
    }
  }

  /**
   * 键盘松开事件
   */
  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
    }
  }

  /**
   * 鼠标移动事件
   */
  onMouseMove(event) {
    if (!this.isLocked) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    // 水平旋转（绕 Y 轴）
    this.camera.rotation.y -= movementX * 0.002;

    // 垂直旋转（限制角度）
    this.camera.rotation.x -= movementY * 0.002;
    this.camera.rotation.x = Math.max(
      -Math.PI / 2 + 0.1,
      Math.min(Math.PI / 2 - 0.1, this.camera.rotation.x)
    );

    // 更新欧拉角顺序
    this.camera.rotation.order = 'YXZ';
  }

  /**
   * 更新指针锁定提示
   */
  updatePointerLockHint() {
    let hint = document.querySelector('.pointer-lock-hint');
    
    if (this.isLocked) {
      if (hint) hint.remove();
    } else {
      if (!hint) {
        hint = document.createElement('div');
        hint.className = 'pointer-lock-hint';
        hint.textContent = '点击画面开始漫游';
        document.body.appendChild(hint);
      }
    }
  }

  /**
   * 绑定 UI 事件
   */
  bindEvents() {
    // 隐藏提示
    document.getElementById('btnHideHint')?.addEventListener('click', () => {
      document.getElementById('controlsHint').style.display = 'none';
    });

    // 返回按钮
    const btnBack = document.getElementById('btnBack');
    if (btnBack) {
      // 动态文案
      const fromEditor = sessionStorage.getItem('preview_from_editor');
      btnBack.textContent = fromEditor ? '← 返回编辑' : '← 返回首页';
      
      btnBack.addEventListener('click', () => {
        // 通过 sessionStorage 判断是否从编辑器跳转而来
        if (sessionStorage.getItem('preview_from_editor')) {
          sessionStorage.removeItem('preview_from_editor');
          window.location.href = 'editor.html';
        } else if (document.referrer.includes('editor.html')) {
          window.history.back();
        } else {
          window.location.href = 'index.html';
        }
      });
    }

    // 自动隐藏顶部栏
    let headerVisible = true;
    let hideTimeout;
    
    document.addEventListener('mousemove', () => {
      const header = document.getElementById('viewerHeader');
      if (!headerVisible) {
        header.style.top = '0';
        headerVisible = true;
      }
      
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        if (this.isLocked) {
          header.style.top = '-60px';
          headerVisible = false;
        }
      }, 2000);
    });
  }

  /**
   * 窗口大小调整
   */
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * 检查展品交互
   */
  checkExhibitInteraction() {
    // 从相机位置发射射线
    const rayDirection = new THREE.Vector3();
    this.camera.getWorldDirection(rayDirection);
    this.raycaster.set(this.camera.position, rayDirection);

    const exhibitMeshes = this.exhibits.map(e => e.mesh);
    const intersects = this.raycaster.intersectObjects(exhibitMeshes, true);

    // 检查距离（增大到 6，让用户更容易触发展品卡片）
    if (intersects.length > 0 && intersects[0].distance < 6) {
      const hitObject = intersects[0].object;
      const exhibit = this.exhibits.find(e => e.mesh === hitObject || e.mesh.children.includes(hitObject));
      
      if (exhibit && exhibit !== this.currentExhibit) {
        this.currentExhibit = exhibit;
        this.showExhibitCard(exhibit);
      }
    } else if (this.currentExhibit) {
      this.currentExhibit = null;
      this.hideExhibitCard();
    }
  }

  /**
   * 显示展品卡片
   */
  showExhibitCard(exhibit) {
    const card = document.getElementById('exhibitCard');
    const image = document.getElementById('cardImage');
    const name = document.getElementById('cardName');
    const desc = document.getElementById('cardDesc');

    image.style.backgroundImage = `url(${exhibit.image})`;
    name.textContent = exhibit.name;
    desc.textContent = exhibit.description || '暂无描述';

    card.style.display = 'block';
    this.showingCard = true;
  }

  /**
   * 隐藏展品卡片
   */
  hideExhibitCard() {
    document.getElementById('exhibitCard').style.display = 'none';
    this.showingCard = false;
  }

  /**
   * 更新移动
   */
  updateMovement() {
    if (!this.isLocked) return;

    const time = performance.now();
    const delta = (time - this.prevTime) / 1000;

    // 阻尼
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    // 计算方向
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    // 应用速度
    const speed = 5.0;
    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * speed * delta;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x -= this.direction.x * speed * delta;
    }

    // 获取相机朝向
    const yaw = this.camera.rotation.y;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);

    // 计算移动向量（基于相机朝向）
    const moveX = (-this.velocity.z * sin - this.velocity.x * cos) * delta;
    const moveZ = (-this.velocity.z * cos + this.velocity.x * sin) * delta;

    // 更新位置
    this.camera.position.x += moveX;
    this.camera.position.z += moveZ;

    // 限制在展厅范围内（展厅为 10x10，墙壁在±5，留0.5余量）
    this.camera.position.x = Math.max(-4.5, Math.min(4.5, this.camera.position.x));
    this.camera.position.z = Math.max(-4.5, Math.min(4.5, this.camera.position.z));
    // 保持人眼高度
    this.camera.position.y = 1.6;

    this.prevTime = time;
  }

  /**
   * 渲染循环
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    this.updateMovement();
    this.checkExhibitInteraction();

    this.renderer.render(this.scene, this.camera);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  window.viewer = new Viewer();
});
