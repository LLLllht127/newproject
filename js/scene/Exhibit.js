/**
 * 展品类
 * 管理单个展品的 3D 对象和数据
 */
class Exhibit {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.type = data.type || 'wall'; // 'wall' 或 'pedestal'
    this.image = data.image || null;
    this.name = data.name || '未命名展品';
    this.description = data.description || '';
    this.position = new THREE.Vector3(
      data.position?.x || 0,
      data.position?.y || 1.6,
      data.position?.z || 0
    );
    this.rotation = new THREE.Vector3(
      data.rotation?.x || 0,
      data.rotation?.y || 0,
      data.rotation?.z || 0
    );
    this.scale = new THREE.Vector3(
      data.scale?.x || 1,
      data.scale?.y || 1,
      data.scale?.z || 1
    );
    
    this.mesh = null;
    this.originalMaterial = null;
    this.highlightMaterial = null;
    this.texture = null;
  }

  /**
   * 生成唯一 ID
   */
  generateId() {
    return 'exhibit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 创建 3D 网格
   */
  createMesh() {
    let geometry, material;

    if (this.type === 'wall') {
      // 墙面挂画 - 创建带画框的平面
      const aspectRatio = 16 / 10;
      const width = 1.2 * this.scale.x;
      const height = width / aspectRatio * this.scale.y;
      const depth = 0.05;

      // 画布几何体
      geometry = new THREE.PlaneGeometry(width, height);
      
      // 创建纹理
      if (this.image) {
        this.texture = new THREE.TextureLoader().load(this.image);
        this.texture.colorSpace = THREE.SRGBColorSpace;
      }

      material = new THREE.MeshStandardMaterial({
        map: this.texture,
        side: THREE.FrontSide,
        roughness: 0.5,
        metalness: 0.1
      });

      this.mesh = new THREE.Mesh(geometry, material);
      
      // 添加画框
      const frameGeometry = new THREE.BoxGeometry(width + 0.1, height + 0.1, depth);
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x2c1810,
        roughness: 0.6,
        metalness: 0.4
      });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.z = -depth / 2;
      this.mesh.add(frame);

    } else {
      // 展台陈列 - 创建直立的展示牌
      const aspectRatio = 3 / 4;
      const height = 1 * this.scale.y;
      const width = height * aspectRatio * this.scale.x;
      const depth = 0.05;

      // 展示牌几何体
      geometry = new THREE.PlaneGeometry(width, height);
      
      // 创建纹理
      if (this.image) {
        this.texture = new THREE.TextureLoader().load(this.image);
        this.texture.colorSpace = THREE.SRGBColorSpace;
      }

      material = new THREE.MeshStandardMaterial({
        map: this.texture,
        side: THREE.DoubleSide,
        roughness: 0.5,
        metalness: 0.1
      });

      this.mesh = new THREE.Mesh(geometry, material);

      // 添加支架
      const standGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.3, 8);
      const standMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.4,
        metalness: 0.6
      });
      const stand = new THREE.Mesh(standGeometry, standMaterial);
      stand.position.y = -height / 2 - 0.15;
      stand.rotation.x = Math.PI / 6;
      this.mesh.add(stand);
    }

    // 保存原始材质
    this.originalMaterial = material;
    
    // 创建高亮材质
    this.highlightMaterial = new THREE.MeshStandardMaterial({
      map: this.texture,
      side: this.type === 'wall' ? THREE.FrontSide : THREE.DoubleSide,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x667eea,
      emissiveIntensity: 0.3
    });

    // 设置位置和旋转
    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // 存储展品引用
    this.mesh.userData.exhibit = this;
  }

  /**
   * 添加到场景
   */
  addToScene(scene) {
    if (!this.mesh) {
      this.createMesh();
    }
    scene.add(this.mesh);
  }

  /**
   * 从场景移除
   */
  removeFromScene(scene) {
    if (this.mesh) {
      scene.remove(this.mesh);
      
      // 清理资源
      if (this.texture) {
        this.texture.dispose();
      }
      if (this.originalMaterial) {
        if (this.originalMaterial.map) {
          this.originalMaterial.map.dispose();
        }
        this.originalMaterial.dispose();
      }
      if (this.highlightMaterial) {
        this.highlightMaterial.dispose();
      }
      if (this.mesh.geometry) {
        this.mesh.geometry.dispose();
      }
      
      this.mesh = null;
    }
  }

  /**
   * 获取数据对象
   */
  getData() {
    return {
      id: this.id,
      type: this.type,
      image: this.image,
      name: this.name,
      description: this.description,
      position: {
        x: this.mesh ? this.mesh.position.x : this.position.x,
        y: this.mesh ? this.mesh.position.y : this.position.y,
        z: this.mesh ? this.mesh.position.z : this.position.z
      },
      rotation: {
        x: this.mesh ? this.mesh.rotation.x : this.rotation.x,
        y: this.mesh ? this.mesh.rotation.y : this.rotation.y,
        z: this.mesh ? this.mesh.rotation.z : this.rotation.z
      },
      scale: {
        x: this.scale.x,
        y: this.scale.y,
        z: this.scale.z
      }
    };
  }

  /**
   * 更新位置
   */
  updatePosition(position) {
    if (this.mesh) {
      this.mesh.position.copy(position);
    }
    this.position = position;
  }

  /**
   * 更新旋转
   */
  updateRotation(rotation) {
    if (this.mesh) {
      this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    }
    this.rotation = rotation;
  }

  /**
   * 更新缩放
   */
  updateScale(scale) {
    this.scale.set(scale, scale, scale);
    if (this.mesh) {
      // 重新创建网格以应用新缩放
      const scene = this.mesh.parent;
      this.removeFromScene(scene);
      this.createMesh();
      this.addToScene(scene);
    }
  }

  /**
   * 更新属性
   */
  updateProperties(name, description) {
    this.name = name;
    this.description = description;
  }
}
